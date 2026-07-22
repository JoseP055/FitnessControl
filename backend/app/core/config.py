import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "FitnessControl API")
    app_env: str = os.getenv("APP_ENV", "development")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_secret_key: str = os.getenv("SUPABASE_SECRET_KEY", "")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    frontend_allowed_origins: str = os.getenv("FRONTEND_ALLOWED_ORIGINS", "")

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)

    @property
    def cors_allowed_origins(self) -> list[str]:
        origins = [self.frontend_url]

        if self.frontend_allowed_origins:
            origins.extend(
                origin.strip()
                for origin in self.frontend_allowed_origins.split(",")
                if origin.strip()
            )

        # Preserve order while removing duplicates and empty values.
        return list(dict.fromkeys(origin for origin in origins if origin))


settings = Settings()
