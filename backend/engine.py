"""
BuySafe Financial Decision Engine

Core responsibilities:
1. Parse seller CSV data
2. Forecast cash flow
3. Determine SAFE / UNSAFE purchase decisions
4. Calculate maximum safe purchase
5. Calculate earliest safe purchase date

Uses only Python standard-library modules.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass
from typing import List, Dict, Optional
import csv
import io


# ---------------------------------------------------------
# DATA MODEL
# ---------------------------------------------------------

@dataclass
class Transaction:
    date: datetime
    type: str
    amount: Decimal
    description: str


@dataclass
class CashFlowResult:
    min_balance: Decimal
    min_balance_date: datetime
    is_safe: bool
    final_balance: Decimal


# ---------------------------------------------------------
# CSV PARSER
# ---------------------------------------------------------

def parse_transactions(csv_content: str) -> List[Transaction]:
    """
    Parse CSV content into Transaction objects.

    Expected columns:
    date,type,amount,description
    """

    if not csv_content.strip():
        return []

    transactions = []

    reader = csv.DictReader(io.StringIO(csv_content.strip()))

    required_columns = {"date", "type", "amount", "description"}

    if not reader.fieldnames:
        raise ValueError("CSV is missing headers")

    missing = required_columns - set(reader.fieldnames)

    if missing:
        raise ValueError(
            f"CSV missing required columns: {', '.join(sorted(missing))}"
        )

    for row_number, row in enumerate(reader, start=2):
        try:
            date = datetime.strptime(
                row["date"].strip(),
                "%Y-%m-%d"
            )

            amount = Decimal(row["amount"].strip())

            transaction_type = row["type"].strip().lower()
            description = row["description"].strip()

            if amount < 0:
                raise ValueError("Transaction amount cannot be negative")

            transactions.append(
                Transaction(
                    date=date,
                    type=transaction_type,
                    amount=amount,
                    description=description
                )
            )

        except Exception as exc:
            raise ValueError(
                f"Invalid transaction on CSV row {row_number}: {exc}"
            ) from exc

    return transactions


# ---------------------------------------------------------
# TRANSACTION ORDER
# ---------------------------------------------------------

def transaction_priority(transaction_type: str) -> int:
    """
    Deterministic ordering for transactions occurring
    on the same date.

    Incoming money is processed before outgoing money.
    """

    if transaction_type in ["amazon_payout", "refund"]:
        return 1

    if transaction_type in ["expense", "fee"]:
        return 2

    if transaction_type == "inventory":
        return 3

    return 4


def sort_transactions(
    transactions: List[Transaction]
) -> List[Transaction]:

    return sorted(
        transactions,
        key=lambda transaction: (
            transaction.date,
            transaction_priority(transaction.type)
        )
    )


# ---------------------------------------------------------
# CASH FLOW CALCULATION
# ---------------------------------------------------------

def calculate_cash_flow(
    current_cash: float,
    transactions: List[Transaction],
    reserve_threshold: float,
    purchase_amount: float = 0,
    purchase_date: Optional[str] = None
) -> CashFlowResult:

    balance = Decimal(str(current_cash))
    reserve = Decimal(str(reserve_threshold))

    all_transactions = list(transactions)

    # Add hypothetical inventory purchase
    if purchase_amount > 0:

        if not purchase_date:
            raise ValueError(
                "purchase_date is required when purchase_amount > 0"
            )

        purchase_datetime = datetime.strptime(
            purchase_date,
            "%Y-%m-%d"
        )

        all_transactions.append(
            Transaction(
                date=purchase_datetime,
                type="inventory",
                amount=Decimal(str(purchase_amount)),
                description="Hypothetical inventory purchase"
            )
        )

    sorted_transactions = sort_transactions(all_transactions)

    min_balance = balance

    if sorted_transactions:
        min_balance_date = sorted_transactions[0].date
    else:
        min_balance_date = datetime.strptime(
            "1970-01-01",
            "%Y-%m-%d"
        )

    for transaction in sorted_transactions:

        if transaction.type in ["amazon_payout", "refund"]:
            balance += transaction.amount

        elif transaction.type in ["expense", "fee", "inventory"]:
            balance -= transaction.amount

        else:
            raise ValueError(
                f"Unknown transaction type: {transaction.type}"
            )

        if balance < min_balance:
            min_balance = balance
            min_balance_date = transaction.date

    is_safe = min_balance >= reserve

    return CashFlowResult(
        min_balance=min_balance,
        min_balance_date=min_balance_date,
        is_safe=is_safe,
        final_balance=balance
    )


# ---------------------------------------------------------
# MAXIMUM SAFE PURCHASE
# ---------------------------------------------------------

def calculate_max_safe_purchase(
    current_cash: float,
    transactions: List[Transaction],
    reserve_threshold: float,
    purchase_date: str
) -> int:
    """
    Find the maximum purchase amount that keeps
    projected cash >= reserve threshold.

    Uses binary search.
    """

    low = 0
    high = int(current_cash)

    while low < high:

        mid = (low + high + 1) // 2

        result = calculate_cash_flow(
            current_cash=current_cash,
            transactions=transactions,
            reserve_threshold=reserve_threshold,
            purchase_amount=mid,
            purchase_date=purchase_date
        )

        if result.is_safe:
            low = mid
        else:
            high = mid - 1

    return low


# ---------------------------------------------------------
# EARLIEST SAFE DATE
# ---------------------------------------------------------

def calculate_earliest_safe_date(
    current_cash: float,
    transactions: List[Transaction],
    reserve_threshold: float,
    purchase_amount: float,
    start_date: str,
    days_to_check: int = 30
) -> Optional[str]:
    """
    Find the earliest date within the next N days
    where the specified purchase is safe.
    """

    start = datetime.strptime(
        start_date,
        "%Y-%m-%d"
    )

    for days_ahead in range(days_to_check + 1):

        candidate_date = (
            start + timedelta(days=days_ahead)
        )

        candidate_date_string = candidate_date.strftime(
            "%Y-%m-%d"
        )

        result = calculate_cash_flow(
            current_cash=current_cash,
            transactions=transactions,
            reserve_threshold=reserve_threshold,
            purchase_amount=purchase_amount,
            purchase_date=candidate_date_string
        )

        if result.is_safe:
            return candidate_date_string

    return None


def calculate_daily_timeline(
    current_cash: float,
    transactions: List[Transaction],
    purchase_amount: float = 0,
    purchase_date: Optional[str] = None,
    start_date: Optional[str] = None,
    days: int = 30
) -> List[Dict]:
    """
    Generate daily cash balance timeline for charting directly from engine calculations.
    """
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    elif transactions:
        start = min(t.date for t in transactions)
    else:
        start = datetime.now()

    all_transactions = list(transactions)
    if purchase_amount > 0 and purchase_date:
        purchase_dt = datetime.strptime(purchase_date, "%Y-%m-%d")
        all_transactions.append(
            Transaction(
                date=purchase_dt,
                type="inventory",
                amount=Decimal(str(purchase_amount)),
                description="Hypothetical inventory purchase"
            )
        )

    tx_by_date = {}
    for tx in all_transactions:
        d_str = tx.date.strftime("%Y-%m-%d")
        if d_str not in tx_by_date:
            tx_by_date[d_str] = []
        tx_by_date[d_str].append(tx)

    timeline = []
    balance = Decimal(str(current_cash))

    for day_offset in range(days):
        day_dt = start + timedelta(days=day_offset)
        d_str = day_dt.strftime("%Y-%m-%d")
        label = day_dt.strftime("%b %d")

        # Inflows first
        for tx in tx_by_date.get(d_str, []):
            if tx.type in ["amazon_payout", "refund"]:
                balance += tx.amount

        # Outflows second
        for tx in tx_by_date.get(d_str, []):
            if tx.type in ["expense", "fee", "inventory"]:
                balance -= tx.amount

        timeline.append({
            "dateKey": d_str,
            "date": label,
            "cash": int(round(balance))
        })

    return timeline


def generate_calculation_trace(
    current_cash: float,
    transactions: List[Transaction],
    reserve_threshold: float,
    purchase_amount: float,
    purchase_date: str,
    min_balance: Decimal,
    min_balance_date: datetime,
    max_safe: int,
    status: str
) -> Dict:
    """
    Generate an auditable, step-by-step mathematical trace of the engine's calculation.
    Similar to a financial diagnostics / verification panel.
    """
    steps = []
    balance = Decimal(str(current_cash))

    steps.append({
        "step": 1,
        "date": purchase_date,
        "action": "Starting Liquid Balance",
        "type": "balance",
        "delta": 0,
        "balance": float(balance),
        "is_trough": False,
        "note": "Verified available cash in seller bank account"
    })

    all_txs = list(transactions)
    if purchase_amount > 0:
        p_date = datetime.strptime(purchase_date, "%Y-%m-%d")
        all_txs.append(
            Transaction(
                date=p_date,
                type="inventory",
                amount=Decimal(str(purchase_amount)),
                description=f"Proposed Order (₹{purchase_amount:,.0f})"
            )
        )

    sorted_txs = sort_transactions(all_txs)
    step_num = 2
    cur_bal = Decimal(str(current_cash))

    for tx in sorted_txs:
        d_str = tx.date.strftime("%Y-%m-%d")
        is_inflow = tx.type in ["amazon_payout", "refund"]
        amt = tx.amount
        delta = float(amt) if is_inflow else -float(amt)
        cur_bal += (amt if is_inflow else -amt)

        is_trough = (tx.date == min_balance_date and cur_bal == min_balance)

        steps.append({
            "step": step_num,
            "date": d_str,
            "action": f"{tx.description}",
            "type": tx.type,
            "delta": delta,
            "balance": float(cur_bal),
            "is_trough": is_trough,
            "note": "Lowest cash point (Safety Bottom)" if is_trough else ""
        })
        step_num += 1

    reserve_dec = Decimal(str(reserve_threshold))
    margin = float(min_balance - reserve_dec)

    return {
        "starting_cash": float(current_cash),
        "purchase_amount": float(purchase_amount),
        "trough_cash": float(min_balance),
        "trough_date": min_balance_date.strftime("%Y-%m-%d"),
        "reserve_threshold": float(reserve_threshold),
        "margin": margin,
        "shortfall": max(0.0, -margin),
        "max_safe_purchase": max_safe,
        "status": status,
        "rule": "Projected Cash Floor >= Reserve Buffer",
        "formula_proof": f"₹{float(min_balance):,.0f} {'≥' if status == 'SAFE' else '<'} ₹{float(reserve_threshold):,.0f}",
        "steps": steps
    }


# ---------------------------------------------------------
# WATERFALL BREAKDOWN (VISUAL ROOT-CAUSE WHY)
# ---------------------------------------------------------

def generate_waterfall_breakdown(
    current_cash: float,
    purchase_amount: float,
    transactions: List[Transaction],
    min_balance: Decimal,
    min_balance_date: datetime,
    reserve_threshold: float,
    status: str
) -> Dict:
    """
    Computes visual step-down cash flow from starting balance to liquidity trough.
    Enables instant root-cause visual comprehension without text walls.
    """
    post_purchase = float(current_cash) - float(purchase_amount)
    
    # Pre-trough transactions strictly on or before min_balance_date
    pre_trough_inflows = Decimal("0")
    pre_trough_expenses = Decimal("0")
    
    for tx in transactions:
        if tx.date <= min_balance_date:
            if tx.type in {"amazon_payout", "income"}:
                pre_trough_inflows += tx.amount
            else:
                pre_trough_expenses += tx.amount

    shortfall = max(0.0, float(reserve_threshold) - float(min_balance))
    buffer = max(0.0, float(min_balance) - float(reserve_threshold))

    steps = [
        {"label": "Current Cash Balance", "amount": float(current_cash), "type": "start"},
        {"label": "Proposed Purchase Order", "amount": -float(purchase_amount), "type": "purchase"},
        {"label": "Cash After Immediate Purchase", "amount": post_purchase, "type": "subtotal"},
        {"label": "Pre-Trough Expenses", "amount": -float(pre_trough_expenses), "type": "expense"},
        {"label": "Pre-Trough Inflows", "amount": float(pre_trough_inflows), "type": "income"},
        {"label": "Lowest Projected Cash Floor", "amount": float(min_balance), "type": "trough"},
        {"label": "Required Reserve Threshold", "amount": float(reserve_threshold), "type": "benchmark"},
    ]

    root_causes = []
    if status == "UNSAFE":
        root_causes.append(f"Purchase size (₹{purchase_amount:,.0f}) absorbs {(purchase_amount / current_cash * 100):.0f}% of liquid reserves.")
        if pre_trough_expenses > 0:
            root_causes.append(f"₹{float(pre_trough_expenses):,.0f} scheduled expenses hit before next settlement payout.")
        root_causes.append(f"Safety reserve requirement (₹{float(reserve_threshold):,.0f}) must remain untouched.")
    else:
        root_causes.append(f"Healthy safety buffer: ₹{buffer:,.0f} above reserve threshold.")
        root_causes.append(f"Upcoming settlements comfortably absorb operational expenses.")

    return {
        "status": status,
        "starting_cash": float(current_cash),
        "purchase_amount": float(purchase_amount),
        "post_purchase_cash": post_purchase,
        "pre_trough_inflows": float(pre_trough_inflows),
        "pre_trough_expenses": float(pre_trough_expenses),
        "trough_cash": float(min_balance),
        "trough_date": min_balance_date.strftime("%Y-%m-%d"),
        "reserve_threshold": float(reserve_threshold),
        "shortfall": shortfall,
        "buffer": buffer,
        "steps": steps,
        "root_causes": root_causes
    }


# ---------------------------------------------------------
# ACTION RECOMMENDATIONS ENGINE ("MAKE THIS PURCHASE SAFE")
# ---------------------------------------------------------

def generate_action_recommendations(
    current_cash: float,
    reserve_threshold: float,
    purchase_amount: float,
    max_safe: int,
    earliest_safe: Optional[str],
    shortfall: float,
    status: str
) -> List[Dict]:
    """
    Generates tangible, interactive action prescriptions.
    Converts BuySafe from an analytical calculator into an actionable decision system.
    """
    recommendations = []

    if status == "UNSAFE":
        # Option A: Downsize purchase
        if max_safe > 0:
            recommendations.append({
                "id": "downsize",
                "action_type": "reduce_purchase",
                "title": "Downsize Purchase Batch",
                "target_value": max_safe,
                "current_value": purchase_amount,
                "delta": purchase_amount - max_safe,
                "badge": "IMMEDIATE SAFE FIX",
                "description": f"Reduce purchase from ₹{purchase_amount:,.0f} to ₹{max_safe:,.0f}. Keeps reserve floor completely intact.",
                "button_text": f"Simulate ₹{max_safe:,.0f} Instead"
            })

        # Option B: Reschedule / Wait for next payout
        if earliest_safe:
            recommendations.append({
                "id": "wait",
                "action_type": "postpone_date",
                "title": "Wait for Amazon Settlement",
                "target_value": earliest_safe,
                "badge": "ZERO INVENTORY COMPROMISE",
                "description": f"Postpone this PO to {earliest_safe} when your next Amazon payout arrives. No batch downsizing required.",
                "button_text": f"Simulate on {earliest_safe}"
            })

        # Option C: Inject capital
        if shortfall > 0:
            recommended_injection = int(round(shortfall / 1000.0) * 1000)
            if recommended_injection < shortfall:
                recommended_injection += 1000
            recommendations.append({
                "id": "inject_capital",
                "action_type": "add_cash",
                "title": "Inject Working Capital Buffer",
                "target_value": float(current_cash + recommended_injection),
                "delta": recommended_injection,
                "badge": "CAPITAL EXPANSION",
                "description": f"Transfer ₹{recommended_injection:,.0f} into working capital account to cover liquidity trough safely.",
                "button_text": f"Simulate +₹{recommended_injection:,.0f} Cash"
            })
    else:
        # Safe purchase recommendations
        buffer = max_safe - purchase_amount
        recommendations.append({
            "id": "proceed",
            "action_type": "execute",
            "title": "Proceed with Purchase Order",
            "target_value": purchase_amount,
            "badge": "SAFE TO EXECUTE",
            "description": f"Order is fully covered. You retain ₹{buffer:,.0f} in safe purchasing capacity beyond this batch.",
            "button_text": "Approved for PO Placement"
        })
        if buffer >= 15000:
            recommendations.append({
                "id": "upsize",
                "action_type": "increase_purchase",
                "title": "Available Bulk Scale Capacity",
                "target_value": max_safe,
                "badge": "GROWTH OPPORTUNITY",
                "description": f"You can safely increase order up to ₹{max_safe:,.0f} without breaking reserve threshold.",
                "button_text": f"Simulate Max Capacity (₹{max_safe:,.0f})"
            })

    return recommendations


# ---------------------------------------------------------
# FINANCIAL RESILIENCE STRESS TESTING
# ---------------------------------------------------------

def run_stress_test(
    current_cash: float,
    reserve_threshold: float,
    purchase_amount: float,
    transactions: List[Transaction],
    analysis_date: str
) -> List[Dict]:
    """
    Evaluates purchase resiliency under 5 adverse financial market conditions.
    Provides mathematical proof of financial fragility vs. resilience.
    """
    scenarios = []

    # 1. Baseline Normal
    res_normal = calculate_cash_flow(
        current_cash=current_cash,
        transactions=transactions,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=analysis_date
    )
    scenarios.append({
        "key": "normal",
        "name": "Normal Baseline",
        "description": "Scheduled payouts and planned expenses proceed exactly on calendar.",
        "status": "SAFE" if res_normal.is_safe else "UNSAFE",
        "min_balance": float(res_normal.min_balance),
        "shortfall": max(0.0, float(Decimal(str(reserve_threshold)) - res_normal.min_balance)),
        "resilience": "ROBUST" if res_normal.is_safe else "UNSAFE"
    })

    # 2. High Expenses (+20% operational / PPC ads spike)
    tx_high_expense = []
    for tx in transactions:
        if tx.type in {"amazon_payout", "income"}:
            tx_high_expense.append(tx)
        else:
            tx_high_expense.append(Transaction(
                date=tx.date,
                type=tx.type,
                amount=tx.amount * Decimal("1.20"),
                description=f"{tx.description} (+20% spike)"
            ))
    res_high_expense = calculate_cash_flow(
        current_cash=current_cash,
        transactions=tx_high_expense,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=analysis_date
    )
    scenarios.append({
        "key": "high_expense",
        "name": "High Expenses (+20%)",
        "description": "Amazon PPC ads and warehouse fees increase by 20% due to peak Q4 competition.",
        "status": "SAFE" if res_high_expense.is_safe else "UNSAFE",
        "min_balance": float(res_high_expense.min_balance),
        "shortfall": max(0.0, float(Decimal(str(reserve_threshold)) - res_high_expense.min_balance)),
        "resilience": "ROBUST" if res_high_expense.is_safe else ("VULNERABLE" if res_normal.is_safe else "CRITICAL")
    })

    # 3. Delayed Payout (Amazon Settlement Delayed 7 Days)
    tx_delayed_payout = []
    for tx in transactions:
        if tx.type in {"amazon_payout", "income"}:
            tx_delayed_payout.append(Transaction(
                date=tx.date + timedelta(days=7),
                type=tx.type,
                amount=tx.amount,
                description=f"{tx.description} (7d delay)"
            ))
        else:
            tx_delayed_payout.append(tx)
    res_delayed_payout = calculate_cash_flow(
        current_cash=current_cash,
        transactions=tx_delayed_payout,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=analysis_date
    )
    scenarios.append({
        "key": "delayed_payout",
        "name": "Payout Delayed 7 Days",
        "description": "Amazon account review or bank holiday delays disbursement release by one week.",
        "status": "SAFE" if res_delayed_payout.is_safe else "UNSAFE",
        "min_balance": float(res_delayed_payout.min_balance),
        "shortfall": max(0.0, float(Decimal(str(reserve_threshold)) - res_delayed_payout.min_balance)),
        "resilience": "ROBUST" if res_delayed_payout.is_safe else ("FRAGILE" if res_normal.is_safe else "CRITICAL")
    })

    # 4. Unexpected Emergency Expense (₹20,000 charge on Day 3)
    try:
        dt_analysis = datetime.strptime(analysis_date, "%Y-%m-%d")
    except Exception:
        dt_analysis = datetime.now()
    tx_shock = list(transactions)
    tx_shock.append(Transaction(
        date=dt_analysis + timedelta(days=3),
        type="expense",
        amount=Decimal("20000"),
        description="Emergency freight / customs charge"
    ))
    res_shock = calculate_cash_flow(
        current_cash=current_cash,
        transactions=tx_shock,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=analysis_date
    )
    scenarios.append({
        "key": "emergency_shock",
        "name": "Unexpected ₹20k Shock",
        "description": "Surprise supplier raw material surcharge or emergency logistics fee occurs on Day 3.",
        "status": "SAFE" if res_shock.is_safe else "UNSAFE",
        "min_balance": float(res_shock.min_balance),
        "shortfall": max(0.0, float(Decimal(str(reserve_threshold)) - res_shock.min_balance)),
        "resilience": "ROBUST" if res_shock.is_safe else ("VULNERABLE" if res_normal.is_safe else "CRITICAL")
    })

    # 5. Worst-Case Compound (Delayed payout + ₹20,000 surprise expense)
    tx_worst = list(tx_delayed_payout)
    tx_worst.append(Transaction(
        date=dt_analysis + timedelta(days=3),
        type="expense",
        amount=Decimal("20000"),
        description="Emergency freight / customs charge"
    ))
    res_worst = calculate_cash_flow(
        current_cash=current_cash,
        transactions=tx_worst,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=analysis_date
    )
    scenarios.append({
        "key": "worst_case",
        "name": "Worst-Case Compound",
        "description": "Simultaneous payout delay and unexpected emergency fee during same cycle.",
        "status": "SAFE" if res_worst.is_safe else "UNSAFE",
        "min_balance": float(res_worst.min_balance),
        "shortfall": max(0.0, float(Decimal(str(reserve_threshold)) - res_worst.min_balance)),
        "resilience": "ROBUST" if res_worst.is_safe else "CRITICAL"
    })

    return scenarios


# ---------------------------------------------------------
# MAIN EVALUATION FUNCTION
# ---------------------------------------------------------

def evaluate_purchase(
    current_cash: float,
    reserve_threshold: float,
    purchase_amount: float,
    csv_data: str,
    purchase_date: Optional[str] = None,
    analysis_date: Optional[str] = None
) -> Dict:

    transactions = parse_transactions(csv_data)

    if analysis_date is None:

        if transactions:
            analysis_date = min(
                transaction.date for transaction in transactions
            ).strftime("%Y-%m-%d")

        else:
            analysis_date = datetime.now().strftime("%Y-%m-%d")

    # If no purchase date was supplied, analyze from analysis date
    if purchase_amount > 0 and purchase_date is None:
        purchase_date = analysis_date

    result = calculate_cash_flow(
        current_cash=current_cash,
        transactions=transactions,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=purchase_date
    )

    max_safe = calculate_max_safe_purchase(
        current_cash=current_cash,
        transactions=transactions,
        reserve_threshold=reserve_threshold,
        purchase_date=analysis_date
    )

    earliest_safe = None

    if purchase_amount > 0:

        earliest_safe = calculate_earliest_safe_date(
            current_cash=current_cash,
            transactions=transactions,
            reserve_threshold=reserve_threshold,
            purchase_amount=purchase_amount,
            start_date=analysis_date
        )

    reserve = Decimal(str(reserve_threshold))

    shortfall = max(
        Decimal("0"),
        reserve - result.min_balance
    )

    daily_forecast = calculate_daily_timeline(
        current_cash=current_cash,
        transactions=transactions,
        purchase_amount=purchase_amount,
        purchase_date=purchase_date,
        start_date=analysis_date,
        days=30
    )

    status_str = "SAFE" if result.is_safe else "UNSAFE"

    calculation_trace = generate_calculation_trace(
        current_cash=current_cash,
        transactions=transactions,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        purchase_date=purchase_date or analysis_date,
        min_balance=result.min_balance,
        min_balance_date=result.min_balance_date,
        max_safe=max_safe,
        status=status_str
    )

    waterfall_breakdown = generate_waterfall_breakdown(
        current_cash=current_cash,
        purchase_amount=purchase_amount,
        transactions=transactions,
        min_balance=result.min_balance,
        min_balance_date=result.min_balance_date,
        reserve_threshold=reserve_threshold,
        status=status_str
    )

    action_recommendations = generate_action_recommendations(
        current_cash=current_cash,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        max_safe=max_safe,
        earliest_safe=earliest_safe,
        shortfall=float(shortfall),
        status=status_str
    )

    stress_test = run_stress_test(
        current_cash=current_cash,
        reserve_threshold=reserve_threshold,
        purchase_amount=purchase_amount,
        transactions=transactions,
        analysis_date=analysis_date
    )

    # Format event timeline
    event_timeline = []
    for tx in transactions:
        event_timeline.append({
            "date": tx.date.strftime("%Y-%m-%d"),
            "type": tx.type,
            "amount": float(tx.amount),
            "description": tx.description,
            "is_before_trough": tx.date <= result.min_balance_date,
            "is_trough_date": tx.date.strftime("%Y-%m-%d") == result.min_balance_date.strftime("%Y-%m-%d")
        })

    return {
        "status": status_str,
        "purchase_amount": purchase_amount,
        "minimum_projected_cash": float(result.min_balance),
        "reserve_threshold": reserve_threshold,
        "shortfall": float(shortfall),
        "maximum_safe_purchase": max_safe,
        "earliest_safe_date": earliest_safe,
        "min_balance_date": result.min_balance_date.strftime("%Y-%m-%d"),
        "final_balance": float(result.final_balance),
        "daily_forecast": daily_forecast,
        "calculation_trace": calculation_trace,
        "waterfall_breakdown": waterfall_breakdown,
        "action_recommendations": action_recommendations,
        "stress_test": stress_test,
        "event_timeline": event_timeline
    }
