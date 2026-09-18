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

    return {
        "status": "SAFE" if result.is_safe else "UNSAFE",
        "purchase_amount": purchase_amount,
        "minimum_projected_cash": float(result.min_balance),
        "reserve_threshold": reserve_threshold,
        "shortfall": float(shortfall),
        "maximum_safe_purchase": max_safe,
        "earliest_safe_date": earliest_safe,
        "min_balance_date": result.min_balance_date.strftime("%Y-%m-%d"),
        "final_balance": float(result.final_balance)
    }
