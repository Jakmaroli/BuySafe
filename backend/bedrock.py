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
            # Fallback stub for local testing without AWS credentials / boto3
            return (
                f"[BuySafe AI Advisory - Local Mode]\n"
                f"Recommendation for {product_data.get('product_title', 'Product')} "
                f"({product_data.get('asin', 'N/A')}):\n"
                f"Decision: {evaluation_data.get('decision', 'PENDING')} with "
                f"{evaluation_data.get('risk_level', 'UNKNOWN')} risk level.\n"
                f"Amazon Bedrock client will generate dynamic contextual narratives when deployed to AWS Lambda."
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
