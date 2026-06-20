from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Shiv Furniture ERP"
    # SQLite by default so it runs with zero setup; switch to Postgres by setting
    # DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/shiv_erp
    DATABASE_URL: str = "sqlite:///./shiv_erp.db"
    SECRET_KEY: str = "change-me-in-prod-shiv-furniture-erp-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"
    CURRENCY: str = "INR"


settings = Settings()
