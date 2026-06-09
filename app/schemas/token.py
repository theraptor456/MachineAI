from pydantic import BaseModel


class Token(BaseModel):
    """JWT access token response schema."""

    access_token: str
    token_type: str = "bearer"
