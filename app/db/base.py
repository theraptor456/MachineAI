"""Import all models so Alembic can discover SQLAlchemy metadata."""
from app.models import Base, User  # noqa: F401
