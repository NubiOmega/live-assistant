from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "Live Assistant API"
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db:5432/postgres",
        env="DATABASE_URL",
    )
    jwt_secret: str = Field(default="super-secret-key", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiry_seconds: int = Field(default=3600, env="JWT_EXPIRY_SECONDS")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()