"""
AWS Lambda handler for BuySafe.

Endpoints:
- POST /analyze
- OPTIONS (CORS)
- /health

The financial calculations are performed by engine.py.
"""

import json
from datetime import datetime

try:
    from engine import evaluate_purchase
except ImportError:
    from backend.engine import evaluate_purchase


def lambda_handler(event, context):

    # -----------------------------
    # CORS preflight
    # -----------------------------
    method = (
        event.get("requestContext", {})
        .get("http", {})
        .get("method")
    )

    if method == "OPTIONS":
        return response(
            200,
            {"message": "CORS preflight successful"}
        )

    # -----------------------------
    # Health check
    # -----------------------------
    if (
        event.get("action") == "health"
        or event.get("rawPath") == "/health"
    ):
        return response(
            200,
            {
                "status": "healthy",
                "service": "BuySafe",
                "timestamp": datetime.now().isoformat()
            }
        )

    try:
        # -----------------------------
        # Read request body
        # -----------------------------
        if "body" in event:

            body = event["body"]

            if isinstance(body, str):
                body = json.loads(body)

        else:
            # Useful for direct Lambda testing
            body = event

        # -----------------------------
        # Extract input
        # -----------------------------
        current_cash = body.get("current_cash")
        reserve_threshold = body.get(
            "reserve_threshold",
            60000
        )
        purchase_amount = body.get(
            "purchase_amount",
            0
        )

        purchase_date = body.get("purchase_date")
        analysis_date = body.get("analysis_date")

        csv_data = body.get("csv_data", "")

        # -----------------------------
        # Validate
        # -----------------------------
        if current_cash is None:
            return error_response(
                "Missing required field: current_cash",
                400
            )

        if not csv_data:
            return error_response(
                "Missing required field: csv_data",
                400
            )

        if float(current_cash) <= 0:
            return error_response(
                "current_cash must be positive",
                400
            )

        if float(reserve_threshold) <= 0:
            return error_response(
                "reserve_threshold must be positive",
                400
            )

        if float(purchase_amount) < 0:
            return error_response(
                "purchase_amount must be non-negative",
                400
            )

        # -----------------------------
        # Determine analysis date
        # -----------------------------
        if analysis_date is None:
            transactions = csv_data.strip().splitlines()

            if len(transactions) > 1:
                # First transaction date
                analysis_date = transactions[1].split(",")[0]

            else:
                analysis_date = datetime.now().strftime(
                    "%Y-%m-%d"
                )

        # -----------------------------
        # Default purchase date
        # -----------------------------
        if purchase_amount > 0 and purchase_date is None:
            purchase_date = analysis_date

        # -----------------------------
        # Run BuySafe engine
        # -----------------------------
        result = evaluate_purchase(
            current_cash=float(current_cash),
            reserve_threshold=float(reserve_threshold),
            purchase_amount=float(purchase_amount),
            csv_data=csv_data,
            purchase_date=purchase_date,
            analysis_date=analysis_date
        )

        result["analysis_date"] = analysis_date
        result["timestamp"] = datetime.now().isoformat()

        return response(200, result)

    except json.JSONDecodeError:
        return error_response(
            "Invalid JSON request body",
            400
        )

    except ValueError as exc:
        return error_response(
            str(exc),
            400
        )

    except Exception as exc:
        print(f"BuySafe error: {exc}")

        return error_response(
            "Internal server error",
            500
        )


# ---------------------------------------------------------
# RESPONSE HELPERS
# ---------------------------------------------------------

def response(status_code, body):

    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }


def error_response(message, status_code=500):

    return response(
        status_code,
        {
            "error": message,
            "timestamp": datetime.now().isoformat()
        }
    )
