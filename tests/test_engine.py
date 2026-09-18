"""
Unit tests for BuySafe initial scaffolding.
Uses Python standard library `unittest` (no external packages required).
"""

import json
import unittest
from backend.engine import FinancialEngine, ProductMetrics, ProposedPurchase, Decision, RiskLevel
from backend.lambda_function import lambda_handler


class TestBuySafeScaffolding(unittest.TestCase):

    def setUp(self):
        self.product = ProductMetrics(
            asin="B08N5WRWNW",
            sku="SKU-AUDIO-001",
            product_title="Wireless Headphones",
            unit_cost=28.50,
            selling_price=79.99,
            current_stock=180,
            monthly_sales_velocity=145.0,
            lead_time_days=25,
            fba_fee=7.20,
            storage_fee_monthly=0.55
        )
        self.purchase = ProposedPurchase(
            asin="B08N5WRWNW",
            sku="SKU-AUDIO-001",
            proposed_units=300,
            supplier_lead_time_days=25,
            available_capital=10000.0
        )

    def test_engine_scaffold(self):
        engine = FinancialEngine()
        result = engine.evaluate(self.product, self.purchase)
        self.assertEqual(result.decision, Decision.MANUAL_REVIEW)
        self.assertEqual(result.risk_level, RiskLevel.MODERATE)
        self.assertEqual(result.capital_required, 8550.0)

    def test_lambda_health_check(self):
        response = lambda_handler({"action": "health"}, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["status"], "healthy")

    def test_lambda_handler_evaluate(self):
        event = {
            "product": {
                "asin": "B08N5WRWNW",
                "sku": "SKU-AUDIO-001",
                "product_title": "Wireless Headphones",
                "unit_cost": 28.50,
                "selling_price": 79.99,
                "current_stock": 180,
                "monthly_sales_velocity": 145.0,
                "lead_time_days": 25
            },
            "purchase": {
                "asin": "B08N5WRWNW",
                "sku": "SKU-AUDIO-001",
                "proposed_units": 100,
                "supplier_lead_time_days": 25,
                "available_capital": 5000.0
            }
        }
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["decision"], "MANUAL_REVIEW")
        self.assertEqual(body["capital_required"], 2850.0)


if __name__ == "__main__":
    unittest.main()
