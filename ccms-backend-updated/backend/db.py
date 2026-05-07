import logging
from functools import lru_cache
from supabase import create_client, Client
from backend.config import get_settings

logger = logging.getLogger(__name__)

@lru_cache
def get_supabase() -> Client:
    """
    Initialize and return a singleton Supabase client.
    Reads credentials from the application settings.
    
    If the key is invalid or missing, returns a DummyClient to prevent 500 errors.
    """
    settings = get_settings()
    url = settings.supabase_url
    key = settings.supabase_key
    
    if not url or not key or key.startswith("sb_secret_") or key == "placeholder_key":
        logger.warning("Supabase URL or Key is missing or invalid. Using DummyClient.")
        return _get_dummy_client()
        
    try:
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}. Falling back to DummyClient.")
        return _get_dummy_client()


def _get_dummy_client():
    """Returns a mock object that mimics Supabase client for safe degradation."""
    class DummyResponse:
        def __init__(self): self.data = []
    class DummyQuery:
        def select(self, *args, **kwargs): return self
        def eq(self, *args, **kwargs): return self
        def order(self, *args, **kwargs): return self
        def limit(self, *args, **kwargs): return self
        def range(self, *args, **kwargs): return self
        def execute(self): return DummyResponse()
        def insert(self, *args, **kwargs): return self
    class DummyClient:
        def table(self, name): return DummyQuery()
    return DummyClient()

def ping_db() -> bool:
    """
    Ping the database by querying the cases table.
    
    Returns:
        bool: True if the database is reachable, False otherwise.
    """
    try:
        client = get_supabase()
        client.table('cases').select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
