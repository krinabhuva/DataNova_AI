# DataNova

### AI-Powered Business Intelligence & Predictive Analytics Platform

**DataNova** transforms raw business data into meaningful analytics, predictive models, and AI-powered business insights.

The platform combines **Data Engineering, Data Analytics, Machine Learning, and Generative AI** into a unified system. Users can upload business datasets, process them through automated ETL pipelines, store structured data in PostgreSQL, manage files through MinIO, visualize business performance, generate predictions, and interact with their data using an AI assistant.

### Core Capabilities

* 📊 Interactive Business Intelligence Dashboard
* 📂 CSV and Excel Data Ingestion
* ⚙️ Automated ETL & Data Quality Processing
* 🗄️ PostgreSQL Data Management
* ☁️ MinIO Object Storage
* 📈 Business Analytics & Visualization
* 🤖 AI-Powered Business Assistant
* 🔮 Sales & Demand Forecasting
* 👥 Customer Segmentation & Churn Prediction
* 🚨 Anomaly Detection
* 📄 Automated PDF & Excel Reports
* 🔐 Authentication & Role-Based Access
* 🐳 Docker-Based Development & Deployment

### Technology Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS
**Backend:** Python, FastAPI
**Database:** PostgreSQL
**Datastore:** MinIO
**Data Processing:** Pandas, NumPy
**Machine Learning:** Scikit-learn, XGBoost, Prophet
**AI:** Gemini API
**Visualization:** Recharts
**DevOps:** Docker, GitHub Actions

> **DataNova — Transforming Data into Intelligent Decisions.**


# DataNova

DataNova is a clean foundation for a data and analytics application. Phase 1 establishes the frontend, backend, and ML package boundaries without implementing product workflows.

## Phase 1 Work Completed

- Added a Next.js App Router frontend using TypeScript and Tailwind CSS.
- Added a reusable service-status component and a typed API client.
- Added a FastAPI application with one `GET /api/v1/health` endpoint.
- Created the requested backend, ML, data, reports, docs, and Docker directory structure.
- Added environment and Git ignore examples.
- Kept authentication, ETL, ML, AI, report generation, and dashboard logic out of scope.

## Project Structure

```text
frontend/                 Next.js, TypeScript, Tailwind CSS
  app/                    App Router page and layout
  components/ui/           Reusable UI components
  lib/                     API client
backend/
  app/
    api/                   HTTP routes
    auth/                  Reserved for authentication
    models/                Reserved for persistence models
    schemas/               API response schemas
    services/              Reserved for application services
    analytics/             Reserved for analytics
    etl/                   Reserved for data pipelines
    ai/                    Reserved for AI integrations
    reports/               Reserved for report features
    database/              Reserved for database setup
  main.py                  FastAPI application entry point
  requirements.txt
ml/                        preprocessing, training, models, evaluation, predictions
data/                      Reserved for project data
reports/                   Reserved for generated reports
docs/                      Project documentation
docker/                    Container configuration (reserved)
```

## Run Locally

Use two terminals.

Backend, from the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`; its health check is `http://localhost:8000/api/v1/health`.

Frontend, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The page checks the health endpoint using `NEXT_PUBLIC_API_URL`; copy the value from `.env.example` to `frontend/.env.local` to override the default. Set `CORS_ORIGINS` in the backend process environment when the frontend runs from a different origin.

## Verification

```powershell
npm --prefix frontend run build
npm --prefix frontend run lint
```

Install the backend requirements before starting the API. No domain behavior beyond the health check is implemented in this phase.
