#!/usr/bin/env python3
"""
Startup health check for CCMS Backend.
Run from the ccms-backend-updated directory:
  python check_start.py
"""
import sys
import os

print("=== CCMS Backend Startup Check ===\n")

# Check .env exists
if not os.path.exists(".env"):
    print("ERROR: .env file not found. Copy .env.example to .env and fill in credentials.")
    sys.exit(1)

# Check required packages
try:
    import fastapi
    import supabase
    import pydantic_settings
    print(f"✓ FastAPI {fastapi.__version__}")
    print(f"✓ supabase-py installed")
    print(f"✓ pydantic-settings installed")
except ImportError as e:
    print(f"ERROR: Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

# Check Supabase connection
try:
    from backend.config import get_settings
    settings = get_settings()
    if not settings.supabase_url or settings.supabase_url == "":
        print("WARNING: SUPABASE_URL not set in .env")
    else:
        print(f"✓ Supabase URL configured: {settings.supabase_url[:40]}...")
    if not settings.supabase_key or settings.supabase_key == "":
        print("WARNING: SUPABASE_KEY not set in .env")
    else:
        print(f"✓ Supabase Key configured (length: {len(settings.supabase_key)})")
    if settings.gemini_api_key:
        print(f"✓ Gemini API Key configured")
    else:
        print("WARNING: GEMINI_API_KEY not set - AI extraction will not work")
except Exception as e:
    print(f"ERROR loading config: {e}")
    sys.exit(1)

print("\n✓ All checks passed. Start backend with:")
print("  uvicorn backend.main:app --reload --port 8000\n")
