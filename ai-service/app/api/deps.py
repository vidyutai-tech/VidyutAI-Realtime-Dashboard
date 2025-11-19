# ems-backend/app/api/deps.py

from typing import Optional
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.models import pydantic_models as models
from app.data.mock_data import MOCK_USER_DB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)
oauth2_scheme_required = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
http_bearer = HTTPBearer(auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme_required)):
    """Decodes JWT token to get current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = models.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = MOCK_USER_DB.get(token_data.email)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(http_bearer)
):
    """Optional authentication - returns user if token is valid, None otherwise."""
    if credentials is None:
        return None
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        token_data = models.TokenData(email=email)
        user = MOCK_USER_DB.get(token_data.email)
        return user
    except (JWTError, KeyError, AttributeError):
        return None