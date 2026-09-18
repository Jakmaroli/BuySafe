import json
import sys

# Ensure UTF-8 output encoding for rupee symbol on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from lambda_function import lambda_handler


csv_data = """date,type,amount,description
2026-09-18,amazon_payout,62000,Weekly payout
2026-09-20,expense,12000,Warehouse rent
2026-09-22,expense,18000,Supplier payment
2026-09-25,fee,8000,Advertising
2026-09-28,amazon_payout,58000,Weekly payout
2026-10-02,expense,15000,Logistics
2026-10-05,amazon_payout,65000,Weekly payout
"""


# ---------------------------------------------
# Test 1: Health
# ---------------------------------------------

print("\nTEST 1: HEALTH")

response = lambda_handler(
    {"action": "health"},
    None
)

print("Status:", response["statusCode"])
print("Body:", response["body"])


# ---------------------------------------------
# Test 2: ₹80,000 purchase
# ---------------------------------------------

print("\nTEST 2: ₹80,000 PURCHASE")

event = {
    "body": json.dumps({
        "current_cash": 142000,
        "reserve_threshold": 60000,
        "purchase_amount": 80000,
        "purchase_date": "2026-09-18",
        "analysis_date": "2026-09-18",
        "csv_data": csv_data
    })
}

response = lambda_handler(event, None)

print("Status:", response["statusCode"])

body = json.loads(response["body"])

print("Decision:", body["status"])
print(
    "Minimum projected cash:",
    body["minimum_projected_cash"]
)
print(
    "Maximum safe purchase:",
    body["maximum_safe_purchase"]
)
print(
    "Earliest safe date:",
    body["earliest_safe_date"]
)


# ---------------------------------------------
# Test 3: Missing CSV
# ---------------------------------------------

print("\nTEST 3: INVALID REQUEST")

event = {
    "body": json.dumps({
        "current_cash": 142000,
        "purchase_amount": 80000
    })
}

response = lambda_handler(event, None)

print("Status:", response["statusCode"])
print("Body:", response["body"])
