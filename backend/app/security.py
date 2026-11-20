import hashlib
import hmac
import secrets
from datetime import timedelta

import bcrypt
import jwt

from app.config import Settings
from app.models import utc_now

JWT_ALGORITHM = "HS256"
POINT_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"
POINT_CODE_LENGTH = 10
BCRYPT_MAX_BYTES = 72


class InvalidToken(Exception):
    pass


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:BCRYPT_MAX_BYTES], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:BCRYPT_MAX_BYTES], password_hash.encode())
    except ValueError:
        return False


def create_access_token(admin_id: int, settings: Settings) -> tuple[str, int]:
    ttl_seconds = settings.ACCESS_TOKEN_TTL_MINUTES * 60
    now = utc_now()
    payload = {"sub": str(admin_id), "iat": now, "exp": now + timedelta(seconds=ttl_seconds)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM), ttl_seconds


def read_access_token(token: str, settings: Settings) -> int:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as error:
        raise InvalidToken from error


def generate_point_code() -> str:
    return "".join(secrets.choice(POINT_CODE_ALPHABET) for _ in range(POINT_CODE_LENGTH))


def device_fingerprint(ip: str, user_agent: str, settings: Settings) -> str:
    message = f"{ip}|{user_agent}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()
