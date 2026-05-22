from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # JWT
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Database
    database_url: str = "sqlite:///./auth.db"

    # App
    app_name: str = "Herry Auth Service"
    debug: bool = False

    # CORS
    allowed_origins: list[str] = ["http://localhost:8000", "http://localhost:3000"]


settings = Settings()
