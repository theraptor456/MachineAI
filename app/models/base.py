from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import CHAR, TypeDecorator
from uuid import UUID


class GUID(TypeDecorator[UUID]):
    """Platform-independent UUID type stored as native UUID or CHAR(36)."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):  # type: ignore[no-untyped-def]
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID

            return dialect.type_descriptor(PostgreSQLUUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):  # type: ignore[no-untyped-def]
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):  # type: ignore[no-untyped-def]
        if value is None:
            return value
        if isinstance(value, UUID):
            return value
        return UUID(str(value))


class Base(DeclarativeBase):
    """Base class for all database models."""


class TimestampMixin:
    """Created and updated timestamp columns for persistent models."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class UUIDPrimaryKeyMixin:
    """UUID primary key column for persistent models."""

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
