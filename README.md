# MachinaAI Backend

This repository contains the backend foundation for MachinaAI. The current scope is infrastructure only: FastAPI application bootstrapping, PostgreSQL connectivity, SQLAlchemy models, Alembic migrations, Docker support, environment configuration, and JWT authentication primitives.

Business logic is intentionally not implemented yet.

## Stack

- **FastAPI** for the HTTP API
- **PostgreSQL** as the primary database
- **SQLAlchemy 2.x** for ORM models and sessions
- **Alembic** for schema migrations
- **python-jose** and **passlib** for JWT/password security primitives
- **Docker Compose** for local API and database orchestration

## Project Structure

```text
app/
  api/v1/              API routers and endpoints
  core/                Settings and security primitives
  db/                  Database engine, sessions, and Alembic metadata imports
  models/              SQLAlchemy models and shared model mixins
  schemas/             Pydantic schemas
alembic/               Alembic migration environment and versions
docs/                  Backend architecture documentation
tests/                 Foundation tests
```

## Local Setup

1. Create an environment file:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -e ".[dev]"
   ```

3. Start PostgreSQL and the API with Docker Compose:

   ```bash
   docker compose up --build
   ```

4. Apply migrations:

   ```bash
   alembic upgrade head
   ```

5. Run tests:

   ```bash
   pytest
   ```

## API

- `GET /api/v1/health` returns a simple health status.

## Environment Variables

See `.env.example` for all supported variables. The most important values are:

- `DATABASE_URL`: SQLAlchemy-compatible PostgreSQL connection string.
- `JWT_SECRET_KEY`: secret used to sign JWT access tokens. Replace the example value before deploying.
- `CORS_ORIGINS`: comma-separated browser origins allowed to call the API.
