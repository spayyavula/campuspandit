"""
Vercel Serverless Entry Point for CampusPandit Backend
This file adapts the FastAPI app for Vercel's serverless environment
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import from app/
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

# Vercel uses this as the entry point
handler = app
