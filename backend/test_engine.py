import sys

# Ensure UTF-8 output encoding for rupee symbol on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from engine import evaluate_purchase


csv_data = """date,type,amount,description
2026-09-18,amazon_payout,62000,Weekly payout
2026-09-20,expense,12000,Warehouse rent
2026-09-22,expense,18000,Supplier payment
2026-09-25,fee,8000,Advertising
2026-09-28,amazon_payout,58000,Weekly payout
2026-10-02,expense,15000,Logistics
2026-10-05,amazon_payout,65000,Weekly payout
"""


print("=" * 50)
print("BUYSAFE FINANCIAL ENGINE TEST")
print("=" * 50)


# ---------------------------------------------------------
# TEST 1
# ---------------------------------------------------------

print("\nTest 1: No purchase")

result = evaluate_purchase(
    current_cash=142000,
    reserve_threshold=60000,
    purchase_amount=0,
    csv_data=csv_data,
    analysis_date="2026-09-18"
)

print("Status:", result["status"])
print("Minimum cash:", result["minimum_projected_cash"])
print("Maximum safe purchase:", result["maximum_safe_purchase"])


# ---------------------------------------------------------
# TEST 2
# ---------------------------------------------------------

print("\nTest 2: ₹80,000 purchase on 2026-09-18")

result = evaluate_purchase(
    current_cash=142000,
    reserve_threshold=60000,
    purchase_amount=80000,
    csv_data=csv_data,
    purchase_date="2026-09-18",
    analysis_date="2026-09-18"
)

print("Status:", result["status"])
print("Minimum cash:", result["minimum_projected_cash"])
print("Shortfall:", result["shortfall"])
print("Earliest safe date:", result["earliest_safe_date"])


# ---------------------------------------------------------
# TEST 3
# ---------------------------------------------------------

print("\nTest 3: ₹55,000 purchase on 2026-09-18")

result = evaluate_purchase(
    current_cash=142000,
    reserve_threshold=60000,
    purchase_amount=55000,
    csv_data=csv_data,
    purchase_date="2026-09-18",
    analysis_date="2026-09-18"
)

print("Status:", result["status"])
print("Minimum cash:", result["minimum_projected_cash"])
print("Maximum safe purchase:", result["maximum_safe_purchase"])


print("\n" + "=" * 50)
print("TESTS COMPLETE")
print("=" * 50)
