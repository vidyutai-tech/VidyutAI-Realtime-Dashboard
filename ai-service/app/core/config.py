# ems-backend/app/core/config.py

from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key-change-in-production-please-set-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    class Config:
        env_file = ".env"

settings = Settings()