from supabase import Client, create_client

from app.core.config import settings


def get_supabase_client() -> Client:
    if not settings.supabase_configured:
        raise RuntimeError(
            "Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY en backend/.env."
        )

    return create_client(settings.supabase_url, settings.supabase_secret_key)
