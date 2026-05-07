from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    anthropic_api_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    ocr_word_threshold: int = 50

    # -----------------------------------------------------------------------
    # Gemini / AI Extractor settings
    # -----------------------------------------------------------------------
    gemini_api_key: str = ""
    """Google AI Studio or Vertex AI API key.
    The google-genai SDK also picks this up automatically from the
    GEMINI_API_KEY environment variable, so setting it here is optional
    but keeps all config in one place."""

    gemini_model: str = "gemini-2.0-flash"
    """Gemini model to use for extraction. gemini-2.0-flash supports
    response_schema (v1beta) and has 15 RPM on the free tier.
    Override via GEMINI_MODEL in .env."""

    max_pages_for_llm: int = 20
    """Maximum number of scored pages to send to the LLM after heuristic
    filtering (the last 3 pages are always included on top of this budget)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    """Call this on hot-reload so .env changes are picked up."""
    get_settings.cache_clear()
    get_supabase_cache_clear()


def get_supabase_cache_clear() -> None:
    """Lazy import to avoid circular deps."""
    try:
        from backend.db import get_supabase
        get_supabase.cache_clear()
    except Exception:
        pass
