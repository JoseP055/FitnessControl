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
    port: int = int(os.getenv("PORT", "8000"))
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_secret_key: str = os.getenv("SUPABASE_SECRET_KEY", "")
    frontend_url: str = os.getenv("FRONTEND_URL", "")
    frontend_url_regex: str = os.getenv("FRONTEND_URL_REGEX", r"https://.*\.vercel\.app")

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)

    @property
    def cors_allowed_origins(self) -> list[str]:
        origins = ["http://localhost:3000"]

        if self.frontend_url:
            origins.extend(
                origin.strip()
                for origin in self.frontend_url.split(",")
                if origin.strip()
            )

        # Preserve order while removing duplicates and empty values.
        return list(dict.fromkeys(origin for origin in origins if origin))

    @property
    def cors_allowed_origin_regex(self) -> str | None:
        regex = (self.frontend_url_regex or "").strip()
        return regex or None


settings = Settings()
