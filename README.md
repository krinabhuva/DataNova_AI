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

DataNova is a foundation for a data and analytics application. The frontend and backend foundations are in place, and authentication is implemented; ETL, analytics, ML, AI, and reporting workflows remain out of scope.

## Implemented

- Added a Next.js App Router frontend using TypeScript and Tailwind CSS.
- Added login and registration forms connected to the FastAPI authentication API.
- Added JWT authentication in an HttpOnly cookie, current-user lookup, logout, and ADMIN-only user listing. Registration assigns the `USER` role; supported roles are `ADMIN`, `ANALYST`, and `USER`.
- Added password hashing, a SQLAlchemy user model, and an Alembic migration.
- Added a FastAPI health endpoint and reusable frontend service-status component.
- Created the requested backend, ML, data, reports, docs, and Docker directory structure.
- Added environment and Git ignore examples.
- Kept ETL, ML, AI, report generation, and dashboard data logic out of scope.

## Project Structure

```text
frontend/                 Next.js, TypeScript, Tailwind CSS
  app/                    App Router page and layout
  components/ui/           Reusable UI components
  lib/                     API client
backend/
  app/
    api/                   HTTP routes
    auth/                  Password hashing, JWT, and access dependencies
    models/                SQLAlchemy user model
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
alembic upgrade head
uvicorn app.main:app --reload
```

Set `JWT_SECRET_KEY` to a unique secret outside development. The API is available at `http://localhost:8000`; its health check is `http://localhost:8000/api/v1/health`.

Frontend, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`; unauthenticated users are sent to `/login`, with registration at `/register`. The session JWT is stored only in an HttpOnly cookie. Set `NEXT_PUBLIC_API_URL` to override the API default, and set `CORS_ORIGINS` in the backend process environment when the frontend runs from a different origin.

## Verification

```powershell
npm --prefix frontend run build
npm --prefix frontend run lint
cd backend
.\.venv\Scripts\python.exe -m pytest
```
