from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token


def test_create_access_token_contains_subject() -> None:
    settings = get_settings()

    token = create_access_token("user-123")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

    assert payload["sub"] == "user-123"
