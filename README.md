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
uploads are validated before storage. The raw file remains in MinIO while ETL run
metadata and structured business records are stored in PostgreSQL.

Configure the MinIO connection and `DATASET_MAX_UPLOAD_BYTES` in `backend/.env`
(see `backend/.env.example`), ensure PostgreSQL and MinIO are reachable, then run
the backend migration and API from the `backend` directory:

```text
alembic upgrade head
uvicorn app.main:app --reload
```

The API provides `POST /api/datasets` (multipart field `file`), `GET /api/datasets`,
`GET /api/datasets/{dataset_id}`, and `DELETE /api/datasets/{dataset_id}`.

### ETL and data quality

Apply the latest Alembic migrations before starting the API. The Data Sources page
keeps the existing upload workflow; use **Run ETL** beside a stored source to open
its pipeline configuration. The pipeline extracts CSV or the first worksheet of an
`.xlsx` file from MinIO, validates selected numeric/date columns, handles missing
values and duplicates, applies the configured column/value transformations, and
loads valid rows into the selected PostgreSQL business table or existing
one-off transformed-table destination.

`POST /api/pipelines/run` accepts `dataset_id`, `destination_table`, and optional
cleaning and transformation settings. Numeric and date columns are comma-separated
in the UI and must match source headers. Missing values can be kept as `NULL`,
rejected with their row, or filled with a supplied value; duplicates can be dropped
or retained. Header normalization, trimming, rename/drop columns, and selected
lower/uppercase value conversions are supported.

Use `customers`, `products`, `orders`, `sales`, or `inventory` as the destination
to upsert structured business records without duplicating their business keys.
Other destination names retain the existing one-off transformed-table behavior.
Business imports should use normalized snake_case headers; order and
sales/inventory rows resolve relationships using `customer_code`, `order_code`,
and `product_code`.

Run history and quality metrics are available from `GET /api/pipelines` and
`GET /api/pipelines/{run_id}`. Each run records total, valid, and rejected rows,
detected duplicates, missing cells, rows loaded, database load status, a
valid-rows/total-rows quality percentage, duration, status, and validation or
execution errors. Dataset deletion is blocked after an ETL run to preserve
dataset-to-run history.

Stored business records are available from `GET /api/customers`,
`GET /api/products`, `GET /api/orders`, `GET /api/sales`, and
`GET /api/inventory`. Each endpoint accepts `limit` (1–500, default 100) and
`offset` query parameters.

> **DataNova — Transforming Data into Intelligent Decisions.**
