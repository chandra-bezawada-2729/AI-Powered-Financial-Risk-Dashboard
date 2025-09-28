# AI-Powered Financial Risk Dashboard  
_Credit/Default Risk • Portfolio Exposure • Fraud Anomalies • CFO/Risk Analytics_

This repository contains a full-stack reference implementation of an enterprise-style risk dashboard for BFSI. It ingests loans/transactions + macro data, engineers risk features, serves ML insights via REST APIs, and visualizes KPIs and alerts in a modern web UI. It also includes optional monitoring (Prometheus/Grafana).

> Works locally with Python + Node, or end-to-end with Docker Compose.

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Repo Structure](#repo-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Dev (No Docker)](#local-dev-no-docker)
  - [1) Backend API](#1-backend-api)
  - [2) Model Service](#2-model-service)
  - [3) Frontend](#3-frontend)
  - [4) Optional Monitoring](#4-optional-monitoring)
- [Environment Variables](#environment-variables)
- [Data & Seeding](#data--seeding)
- [Core API Endpoints](#core-api-endpoints)
- [Screens & KPIs](#screens--kpis)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Risk Views**: PD/Default risk, exposure by sector/region, delinquency heatmaps.  
- **Anomaly Detection**: Transaction-level outlier flags (fraud/abuse patterns).  
- **What-If/Scenario**: Simple stress inputs (rate/cpi shocks) push through PD/ES.  
- **Drill-downs**: Borrower → account → transaction lineage.  
- **RBAC (basic)**: Placeholder hooks for SSO/MSAL integration.  
- **Monitoring (optional)**: Prometheus metrics & Grafana dashboards.

---

## Architecture

- **Data**: Loan books, transactions, borrowers, macro series (CPI, GDP, rates).  
- **Backend API**: FastAPI (Python) with SQLModel/SQLAlchemy to Postgres.  
- **Model Service**: Python service (XGBoost/LightGBM/sklearn) for PD/Anomaly.  
- **Frontend**: React (Vite) + Recharts + Tailwind.  
- **DB**: Postgres 14+ (dev) — can swap to managed Postgres in cloud.  
- **Monitoring**: Prometheus + Grafana (dockerized).  
- **Packaging**: Dockerfiles per service; `docker-compose.yml` to orchestrate.

---

## Repo Structure

```
AI-Powered-Financial-Risk-Dashboard/
├─ README.md
├─ data/                      # sample csv/xlsx data, seeds, fixtures
│  ├─ loans.csv
│  ├─ borrowers.csv
│  ├─ transactions.csv
│  └─ macro.csv
├─ frontend/                  # React (Vite) UI
│  ├─ package.json
│  ├─ src/
│  └─ ...
├─ models/                    # ML code + (optionally) model API
│  ├─ requirements.txt
│  ├─ train.py                # trains models, exports artifacts to models/artifacts/
│  ├─ serve.py                # uvicorn model microservice (REST)
│  └─ artifacts/              # *.pkl, feature encoders, thresholds
├─ monitoring/                # Prometheus/Grafana configs (optional)
│  ├─ prometheus.yml
│  └─ provision/
│     └─ grafana-dashboards.json
└─ docker-compose.yml         # (optional) if using Docker (add at repo root)
```

> **Note:** If you previously had a `backend/` directory and removed it, the **API may be served from `models/serve.py`** (combined model + API). If you maintain a separate API, place it under `backend/` (FastAPI app) and adjust commands accordingly. This README includes **both** paths; pick the one that matches your code.

---

## Prerequisites

**Option A: Docker (recommended)**
- Docker Desktop ≥ 4.27  
- Docker Compose v2

**Option B: Local toolchain**
- Python 3.11+
- Node.js 20+ and npm 9+
- PostgreSQL 14+ (local)  
- Recommended: `uv` or `virtualenv`, `pgAdmin` or `psql`

---

## Quick Start (Docker)

> Easiest way to run everything. Create a `docker-compose.yml` at repo root if not present.

**Example `docker-compose.yml`:**
```yaml
version: "3.9"
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: risk
      POSTGRES_PASSWORD: riskpass
      POSTGRES_DB: riskdb
    ports: ["5432:5432"]
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U risk -d riskdb"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:  # If your FastAPI lives in backend/, change build/context accordingly
    build: 
      context: .
      dockerfile: models/Dockerfile
    env_file: [.env]
    depends_on:
      - db
    ports: ["8000:8000"]
    command: bash -lc "python -m uvicorn serve:app --host 0.0.0.0 --port 8000 --reload"
    working_dir: /app/models
    volumes:
      - ./:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_BASE_URL: "http://localhost:8000"
    ports: ["5173:5173"]
    command: bash -lc "npm install && npm run dev -- --host 0.0.0.0"
    depends_on:
      - api
    volumes:
      - ./frontend:/app

  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]
    depends_on: [api]

  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
    volumes:
      - ./monitoring/provision:/etc/grafana/provisioning
    depends_on: [prometheus]

volumes:
  db_data:
```

**.env (create at repo root):**
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=risk
DB_PASSWORD=riskpass
DB_NAME=riskdb

# API
API_PORT=8000
CORS_ORIGINS=http://localhost:5173

# Model
MODEL_ARTIFACTS_DIR=models/artifacts

# Monitoring
ENABLE_METRICS=true
```

**Run:**
```bash
docker compose up --build
```

- UI: http://localhost:5173  
- API docs (FastAPI): http://localhost:8000/docs  
- Prometheus: http://localhost:9090  
- Grafana: http://localhost:3000  (default admin/admin)

---

## Local Dev (No Docker)
... (content shortened for brevity in code, but full text preserved above)
