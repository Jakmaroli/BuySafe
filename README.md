# BuySafe

> **An AI inventory purchase safety engine for Amazon sellers.**

BuySafe helps Amazon e-commerce merchants avoid costly cashflow traps, stockouts, and dead inventory by evaluating purchase orders against sales velocity, lead times, FBA fees, storage costs, and market risk before placing supplier orders.

---

## Project Structure

```
buysafe/
├── backend/
│   ├── engine.py           # Core financial decision engine models & evaluation stubs
│   ├── lambda_function.py  # AWS Lambda entry point & API Gateway request handler
│   └── bedrock.py          # Amazon Bedrock integration wrapper for AI explanations
├── frontend/               # React / Vite web dashboard (to be created)
├── data/
│   └── sample_seller.csv   # Realistic Amazon seller dataset for testing & simulation
├── tests/                  # Unit and integration test suites
├── .gitignore              # Ignored patterns for Python + React/Vite
└── README.md               # Project documentation
```

---

## Module Overview

### 1. `backend/engine.py`
The core calculation engine for inventory purchase evaluations.
- **Design Philosophy**: Built primarily with the Python standard library (`dataclasses`, `enum`, `decimal`, `typing`).
- **Core Entities**:
  - `ProductMetrics`: ASIN, SKU, unit costs, Amazon fees, velocity, return rates.
  - `ProposedPurchase`: Planned reorder units, lead times, and available working capital.
  - `EvaluationResult`: Risk rating, recommended order quantities, and projected ROI.
- *Status*: Data models defined; financial decision algorithm to be implemented.

### 2. `backend/lambda_function.py`
The serverless deployment entry point for AWS Lambda.
- Parses incoming API Gateway requests and serializes standard JSON responses.
- Invokes `engine.py` for risk calculations and `bedrock.py` for AI-generated recommendations.
- Includes CORS preflight handling and health-check endpoints.

### 3. `backend/bedrock.py`
Amazon Bedrock foundation model wrapper (Claude 3 / Titan).
- Translates numerical risk metrics into human-readable, actionable advice for sellers.
- Gracefully handles local environments without AWS credentials or `boto3`.

### 4. `data/sample_seller.csv`
Sample dataset simulating varied Amazon catalog scenarios:
- High-velocity winning products
- Slow-moving products nearing overstock with storage penalty risks
- High-return items with negative net margins
- Steady baseline products

### 5. `frontend/`
Dedicated directory for the forthcoming user interface (React + Vite).

### 6. `tests/`
Dedicated directory for automated unit and integration tests.

---

## Getting Started (Local Development)

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- No third-party packages required for baseline local testing (standard library only).

### Verify Backend Files
You can verify the backend modules locally with standard Python:

```bash
# Test imports and dataclass validation
python -c "from backend.engine import FinancialEngine, ProductMetrics, ProposedPurchase; print('Engine loaded successfully')"
python -c "from backend.lambda_function import lambda_handler; print('Lambda handler loaded successfully')"
python -c "from backend.bedrock import BedrockExplainer; print('Bedrock wrapper loaded successfully')"
```

---

## Hackathon Roadmap

1. [x] Project Scaffolding & Architecture Skeleton
2. [ ] Financial Decision Algorithm Implementation (`backend/engine.py`)
   - Days of inventory (DOI) calculations
   - Seasonal velocity adjustments & lead-time safety stock buffers
   - Cashflow & holding cost penalty modeling
3. [ ] Amazon Bedrock Prompt Tuning & Contextual Narratives (`backend/bedrock.py`)
4. [ ] Unit & Integration Testing Suite (`tests/`)
5. [ ] Interactive Frontend UI with React + Vite (`frontend/`)
6. [ ] AWS Deployment via AWS Lambda & API Gateway
