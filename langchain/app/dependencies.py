import jwt
from fastapi import HTTPException, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import settings

_bearer = HTTPBearer()


def verify_internal_key(x_internal_key: str = Header(..., alias="x-internal-key")) -> None:
    if x_internal_key != settings.ai_service_secret:
        raise HTTPException(status_code=403, detail="Invalid internal key")


def verify_stream_token(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    try:
        return jwt.decode(
            credentials.credentials,
            settings.ai_service_secret,
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Stream token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid stream token")
