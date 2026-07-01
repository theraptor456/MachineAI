# Backend Foundation

## Purpose

The backend foundation establishes the infrastructure needed for future MachinaAI business workflows without implementing domain-specific behavior.

## Application Layer

`app/main.py` exposes a FastAPI application factory. API routes are grouped under the `/api/v1` prefix so future versions can be introduced without breaking existing clients.

## Database Layer

`app/db/session.py` creates the SQLAlchemy engine and request-scoped session dependency from the `DATABASE_URL` environment variable. Models inherit from a shared declarative base in `app/models/base.py`.

Current foundational model:

- `User`: identity table for future authentication and authorization flows.

## Migrations

Alembic is configured in `alembic.ini` and `alembic/env.py`. The migration environment reads the same settings as the application so local, CI, and deployed environments can use different databases through environment variables.

The initial migration creates the `users` table and unique email index.

## Configuration

Configuration is centralized in `app/core/config.py` using `pydantic-settings`. Values are loaded from environment variables and optionally from a local `.env` file.

## JWT Authentication Architecture

`app/core/security.py` contains reusable primitives for:

- Creating signed JWT access tokens.
- Hashing passwords.
- Verifying passwords.

No login, registration, authorization policy, or business workflow has been implemented yet. Those should be added in feature-specific modules once product requirements are finalized.

## Docker

`Dockerfile` builds the API container. `docker-compose.yml` runs the API with a PostgreSQL 16 service and a persistent database volume for local development.
