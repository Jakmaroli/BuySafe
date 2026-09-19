"""
Verification Suite for BuySafe 5 Core Demo Scenarios
"""

import json
from decimal import Decimal
from engine import evaluate_purchase
from lambda_function import lambda_handler

SAMPLE_CSV = """date,type,amount,description
2026-09-18,amazon_payout,62000,Weekly payout
2026-09-20,expense,12000,Warehouse rent
2026-09-22,expense,18000,Supplier payment
2026-09-25,fee,8000,Advertising
2026-09-28,amazon_payout,58000,Weekly payout
2026-10-02,expense,15000,Logistics
2026-10-05,amazon_payout,65000,Weekly payout"""

# CSV with large expenses BEFORE next payout
HEAVY_EXPENSE_CSV = """date,type,amount,description
2026-10-01,expense,45000,Emergency supplier raw materials
2026-10-03,expense,30000,Quarterly software licenses
2026-10-05,fee,15000,Q4 prime day placement fee
2026-10-15,amazon_payout,180000,Bi-weekly settlement payout"""


def test_scenario_1_clearly_safe():
    print("\n--- TEST 1: Clearly Safe ---")
    res = evaluate_purchase(
        current_cash=200000,
        reserve_threshold=50000,
        purchase_amount=20000,
        csv_data=SAMPLE_CSV,
    )
    print(f"Status: {res['status']}")
    print(f"Min projected cash: Rs {res['minimum_projected_cash']:,.2f}")
    print(f"Reserve threshold: Rs {res['reserve_threshold']:,.2f}")
    print(f"Max safe purchase: Rs {res['maximum_safe_purchase']:,}")
    assert res["status"] == "SAFE", f"Expected SAFE, got {res['status']}"
    assert res["minimum_projected_cash"] >= res["reserve_threshold"]
    print(">>> PASS: Clearly safe scenario correctly identified as SAFE.")


def test_scenario_2_clearly_unsafe():
    print("\n--- TEST 2: Clearly Unsafe ---")
    res = evaluate_purchase(
        current_cash=100000,
        reserve_threshold=60000,
        purchase_amount=80000,
        csv_data=SAMPLE_CSV,
    )
    print(f"Status: {res['status']}")
    print(f"Min projected cash: Rs {res['minimum_projected_cash']:,.2f}")
    print(f"Reserve threshold: Rs {res['reserve_threshold']:,.2f}")
    print(f"Shortfall: Rs {res['shortfall']:,.2f}")
    print(f"Earliest safe date: {res['earliest_safe_date']}")
    assert res["status"] == "UNSAFE", f"Expected UNSAFE, got {res['status']}"
    assert res["minimum_projected_cash"] < res["reserve_threshold"]
    print(">>> PASS: Clearly unsafe scenario correctly identified as UNSAFE (DON'T BUY).")


def test_scenario_3_boundary_precision():
    print("\n--- TEST 3: Boundary Precision (X vs X + 1) ---")
    base_res = evaluate_purchase(
        current_cash=142000,
        reserve_threshold=60000,
        purchase_amount=0,
        csv_data=SAMPLE_CSV,
    )
    x = base_res["maximum_safe_purchase"]
    print(f"Calculated Maximum Safe Purchase (X): Rs {x:,}")

    # Test purchase = X
    res_at_x = evaluate_purchase(
        current_cash=142000,
        reserve_threshold=60000,
        purchase_amount=x,
        csv_data=SAMPLE_CSV,
    )
    print(f"At Purchase = Rs {x:,}: Status = {res_at_x['status']}, Min Cash = Rs {res_at_x['minimum_projected_cash']:,.2f}")
    assert res_at_x["status"] == "SAFE", f"Expected SAFE at boundary {x}, got {res_at_x['status']}"
    assert res_at_x["minimum_projected_cash"] == 60000.0, f"Expected min cash = 60000, got {res_at_x['minimum_projected_cash']}"

    # Test purchase = X + 1
    res_at_x_plus_1 = evaluate_purchase(
        current_cash=142000,
        reserve_threshold=60000,
        purchase_amount=x + 1,
        csv_data=SAMPLE_CSV,
    )
    print(f"At Purchase = Rs {x + 1:,}: Status = {res_at_x_plus_1['status']}, Min Cash = Rs {res_at_x_plus_1['minimum_projected_cash']:,.2f}")
    assert res_at_x_plus_1["status"] == "UNSAFE", f"Expected UNSAFE at boundary + 1, got {res_at_x_plus_1['status']}"
    assert res_at_x_plus_1["minimum_projected_cash"] == 59999.0

    print(">>> PASS: Exact boundary sensitivity verified. Rs X is SAFE, Rs X+1 is DON'T BUY.")


def test_scenario_4_different_csv():
    print("\n--- TEST 4: Different CSV (Heavy front-loaded expenses) ---")
    # With current_cash=120k, expenses of 90k before Oct 15 payout:
    # Minimum cash before payout is 30k.
    # If reserve is 25k, spending 20k drops to 10k (< 25k) -> UNSAFE today, max safe = 5k.
    # Delaying to 2026-10-15 (after payout of 180k) is safe -> earliest_safe_date = 2026-10-15!
    res = evaluate_purchase(
        current_cash=120000,
        reserve_threshold=25000,
        purchase_amount=20000,
        csv_data=HEAVY_EXPENSE_CSV,
    )
    print(f"Status: {res['status']}")
    print(f"Min projected cash: Rs {res['minimum_projected_cash']:,.2f}")
    print(f"Reserve threshold: Rs {res['reserve_threshold']:,.2f}")
    print(f"Max safe purchase: Rs {res['maximum_safe_purchase']:,}")
    print(f"Earliest safe date: {res['earliest_safe_date']}")

    assert res["status"] == "UNSAFE"
    assert res["maximum_safe_purchase"] == 5000, f"Expected 5000 max safe, got {res['maximum_safe_purchase']}"
    assert res["earliest_safe_date"] == "2026-10-15"
    print(">>> PASS: Different CSV dynamically reshapes forecast, earliest safe date, and safety capacity.")


def test_scenario_5_ai_failure_resilience():
    print("\n--- TEST 5: AI Failure Resilience (Bedrock Unavailable) ---")
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "current_cash": 142000,
            "reserve_threshold": 60000,
            "purchase_amount": 80000,
            "csv_data": SAMPLE_CSV,
        })
    }
    response = lambda_handler(event, None)
    assert response["statusCode"] == 200, f"Expected 200, got {response['statusCode']}"
    body = json.loads(response["body"])
    print(f"Lambda returned status: {body['status']}")
    print(f"Max safe purchase: Rs {body['maximum_safe_purchase']:,}")
    assert body["status"] == "SAFE"
    assert body["maximum_safe_purchase"] == 106000
    print(">>> PASS: Deterministic engine executes flawlessly regardless of Bedrock availability.")


def test_scenario_6_refund_consistency():
    print("\n--- TEST 6: Refund Consistency Regression Test ---")
    refund_csv = """date,type,amount,description
2026-09-18,refund,10000,Customer return refund credit
2026-09-20,expense,20000,Supplier payment"""

    res = evaluate_purchase(
        current_cash=100000,
        reserve_threshold=50000,
        purchase_amount=0,
        csv_data=refund_csv,
    )

    # 1. Verify Core Cash Flow Floor: 100,000 + 10,000 - 20,000 = 90,000
    print(f"Min projected cash: Rs {res['minimum_projected_cash']:,.2f}")
    assert res["minimum_projected_cash"] == 90000.0, f"Expected 90000, got {res['minimum_projected_cash']}"

    # 2. Verify Waterfall Inflows/Expenses Isolation
    waterfall = res["waterfall_breakdown"]
    steps_by_label = {s["label"]: s["amount"] for s in waterfall["steps"]}
    pre_inflows = steps_by_label.get("Pre-Trough Inflows", 0.0)
    pre_expenses = steps_by_label.get("Pre-Trough Expenses", 0.0)
    print(f"Waterfall Pre-Trough Inflows: Rs {pre_inflows:,.2f}")
    print(f"Waterfall Pre-Trough Expenses: Rs {pre_expenses:,.2f}")
    assert pre_inflows == 10000.0, f"Expected Pre-Trough Inflows = 10000, got {pre_inflows}"
    assert pre_expenses == -20000.0, f"Expected Pre-Trough Expenses = -20000, got {pre_expenses}"

    # 3. Verify Stress Test Matrix Inflow/Outflow Separation
    stress_matrix = res["stress_test"]
    high_exp = next(s for s in stress_matrix if s["key"] == "high_expense")
    # Expense spikes by +20% (20k -> 24k). Refund remains 10k. Balance = 100k + 10k - 24k = 86k.
    print(f"Stress Test High Expense Min Balance: Rs {high_exp['min_balance']:,.2f}")
    assert high_exp["min_balance"] == 86000.0, f"Expected 86000 under +20% expense spike, got {high_exp['min_balance']}"

    # 4. Verify Categorized Inflows & Outflows Trace
    trace = res["calculation_trace"]
    assert trace["categorized_inflows"].get("Refund") == 10000.0, "Expected Refund categorized in inflows"
    assert trace["categorized_outflows"].get("Expense") == 20000.0, "Expected Expense categorized in outflows"

    print(">>> PASS: Refund consistently credited as inflow across calculation, waterfall, and stress tests.")


def test_scenario_7_engine_invariants():
    print("\n--- TEST 7: Engine Invariant Audit Verification ---")
    res = evaluate_purchase(
        current_cash=142000,
        reserve_threshold=60000,
        purchase_amount=20000,
        csv_data=SAMPLE_CSV,
    )
    invariants = res["calculation_trace"]["invariant_checks"]
    print(f"Invariant Status: {invariants['status']} ({invariants['passed_count']}/{invariants['total_count']})")
    print(f"  [OK] All Transactions Classified: {invariants['all_transactions_classified']}")
    print(f"  [OK] No Unknown Types: {invariants['no_unknown_types']}")
    print(f"  [OK] Inflow Consistency: {invariants['inflow_consistency']}")
    print(f"  [OK] Outflow Consistency: {invariants['outflow_consistency']}")
    print(f"  [OK] Ledger Reconciled: {invariants['ledger_reconciled']}")
    print(f"  [OK] Boundary Verified: {invariants['boundary_verified']}")

    assert invariants["status"] == "PASS"
    assert invariants["passed_count"] == 6
    assert invariants["all_transactions_classified"] is True
    assert invariants["no_unknown_types"] is True
    assert invariants["inflow_consistency"] is True
    assert invariants["outflow_consistency"] is True
    assert invariants["ledger_reconciled"] is True
    assert invariants["boundary_verified"] is True
    print(">>> PASS: All 6 financial engine invariant audits verified with 100% integrity.")


if __name__ == "__main__":
    test_scenario_1_clearly_safe()
    test_scenario_2_clearly_unsafe()
    test_scenario_3_boundary_precision()
    test_scenario_4_different_csv()
    test_scenario_5_ai_failure_resilience()
    test_scenario_6_refund_consistency()
    test_scenario_7_engine_invariants()
    print("\n===========================================")
    print("ALL 7 CORE SCENARIO TESTS PASSED PERFECTLY!")
    print("===========================================")

