"""
Configuration settings for the VidyutAI AI Service.
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings."""
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "VidyutAI AI Service"
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Database settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/vidyutai")
    INFLUXDB_URL: str = os.getenv("INFLUXDB_URL", "http://localhost:8086")
    INFLUXDB_TOKEN: str = os.getenv("INFLUXDB_TOKEN", "")
    INFLUXDB_ORG: str = os.getenv("INFLUXDB_ORG", "vidyutai")
    INFLUXDB_BUCKET: str = os.getenv("INFLUXDB_BUCKET", "energy_data")
    
    # Kafka settings
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_CONSUMER_GROUP: str = os.getenv("KAFKA_CONSUMER_GROUP", "vidyutai-ai-service")
    KAFKA_TOPIC_ENERGY_DATA: str = os.getenv("KAFKA_TOPIC_ENERGY_DATA", "energy-data")
    KAFKA_TOPIC_ANOMALIES: str = os.getenv("KAFKA_TOPIC_ANOMALIES", "energy-anomalies")
    
    # Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "../models")
    ANOMALY_DETECTION_MODEL: str = os.getenv("ANOMALY_DETECTION_MODEL", "isolation_forest_model.pkl")
    PREDICTION_MODEL: str = os.getenv("PREDICTION_MODEL", "energy_prediction_model.pkl")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra fields from .env
    }

# Create settings instance
settings = Settings()