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

### Data Sources API

Data source uploads are stored in MinIO under `raw/`; PostgreSQL stores the dataset
filename, format, size, row/column counts, and upload timestamp. CSV and `.xlsx`
uploads are validated before storage. ETL and transformed data are not part of this
flow.

Configure the MinIO connection and `DATASET_MAX_UPLOAD_BYTES` in `backend/.env`
(see `backend/.env.example`), ensure PostgreSQL and MinIO are reachable, then run
the backend migration and API from the `backend` directory:

```text
alembic upgrade head
uvicorn app.main:app --reload
```

The API provides `POST /api/datasets` (multipart field `file`), `GET /api/datasets`,
`GET /api/datasets/{dataset_id}`, and `DELETE /api/datasets/{dataset_id}`.

> **DataNova — Transforming Data into Intelligent Decisions.**
