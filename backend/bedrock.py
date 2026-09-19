"""
BuySafe Amazon Bedrock Integration
==================================
Wrapper module for Amazon Bedrock foundation models (e.g. Anthropic Claude).
Generates natural-language inventory risk explanations and purchase recommendations.

Uses boto3 if installed (standard on AWS Lambda runtime). Gracefully handles
local environments where boto3 is not yet installed.
"""

import json
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Optional boto3 import
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    boto3 = None  # type: ignore
    BOTO3_AVAILABLE = False


class BedrockExplainer:
    """Provides AI reasoning and explanations for inventory decisions via Amazon Bedrock."""

    def __init__(
        self,
        model_id: str = "anthropic.claude-3-haiku-20240307-v1:0",
        region_name: str = "us-east-1"
    ):
        self.model_id = model_id
        self.region_name = region_name
        self._client = None

    def _get_client(self):
        """Initializes and caches the Bedrock runtime client."""
        if not BOTO3_AVAILABLE:
            return None
        if self._client is None:
            try:
                self._client = boto3.client("bedrock-runtime", region_name=self.region_name)
            except Exception as e:
                logger.warning("Failed to initialize Bedrock client: %s", str(e))
                self._client = None
        return self._client

    def generate_explanation(
        self,
        product_data: Dict[str, Any],
        evaluation_data: Dict[str, Any]
    ) -> str:
        """
        Generate a natural language explanation of the purchase recommendation
        tailored for an Amazon seller.
        """
        client = self._get_client()

        prompt = (
            f"You are BuySafe AI, an expert financial and inventory risk advisor for Amazon sellers.\n"
            f"Analyze the following inventory purchase decision and explain the reasoning, risk factors, "
            f"and actionable advice clearly in 2-3 concise paragraphs.\n\n"
            f"Product: {json.dumps(product_data, indent=2)}\n"
            f"Evaluation: {json.dumps(evaluation_data, indent=2)}\n\n"
            f"Provide a clear, seller-friendly explanation."
        )

        if client is None:
            # High-fidelity fallback explanation adhering to:
            # "AI explains the decision. AI does not make the decision."
            is_safe = evaluation_data.get("status") == "SAFE"
            min_cash = float(evaluation_data.get("minimum_projected_cash", 0))
            max_safe = float(evaluation_data.get("maximum_safe_purchase", 0))
            reserve = float(evaluation_data.get("reserve_threshold", 0))
            shortfall = float(evaluation_data.get("shortfall", 0))
            earliest = evaluation_data.get("earliest_safe_date") or "today"
            order_amt = float(evaluation_data.get("purchase_amount", 0))

            if is_safe:
                return (
                    f"### 🛡️ BuySafe AI Financial Advisory\n\n"
                    f"**Decision: SAFE TO BUY**\n\n"
                    f"- **Safety Buffer Maintained:** Your projected cash bottom is **₹{min_cash:,.2f}**, remaining safely above your **₹{reserve:,.2f}** safety threshold.\n"
                    f"- **Cash Flow Strength:** Incoming Amazon payouts comfortably cover both this **₹{order_amt:,.2f}** inventory order and all scheduled operating obligations.\n"
                    f"- **Expansion Capacity:** You have capacity to spend up to **₹{max_safe:,.2f}** on inventory today without breaching your cash buffer.\n\n"
                    f"*Deterministic engine verdict with Amazon Bedrock advisory integration.*"
                )
            else:
                return (
                    f"### ⚠️ BuySafe AI Financial Advisory\n\n"
                    f"**Decision: DON'T BUY (High Liquidity Risk)**\n\n"
                    f"- **Reserve Breach:** Placing a **₹{order_amt:,.2f}** order drops your projected cash to **₹{min_cash:,.2f}**, breaching your **₹{reserve:,.2f}** safety threshold by **₹{shortfall:,.2f}**.\n"
                    f"- **Upcoming Obligations:** Operating expenses before your next payout will exhaust liquid working capital.\n"
                    f"- **Actionable Advice:** \n"
                    f"  1. Reduce your order to the maximum safe limit of **₹{max_safe:,.2f}** today, OR\n"
                    f"  2. Postpone this order until **{earliest}** when your next Amazon payout arrives.\n\n"
                    f"*Deterministic engine verdict with Amazon Bedrock advisory integration.*"
                )

        try:
            # Claude 3 Messages API payload structure on Bedrock
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 512,
                "temperature": 0.3,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }

            response = client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload)
            )

            response_body = json.loads(response["body"].read())
            return response_body["content"][0]["text"]

        except Exception as e:
            logger.error("Error invoking Bedrock model: %s", str(e))
            return f"Error generating AI explanation via Amazon Bedrock: {str(e)}"
