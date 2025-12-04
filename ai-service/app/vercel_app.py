# Vercel entry point for FastAPI
import sys
import os
from pathlib import Path

# Get the ai-service root directory
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

# Import the FastAPI app
from app.main import app

# Vercel requires the app to be named 'app' or use a handler
# For ASGI apps like FastAPI, we export directly
__all__ = ['app']

