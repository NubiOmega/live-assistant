from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Live Assistant API"
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db:5432/postgres",
        env="DATABASE_URL",
    )
    jwt_secret: str = Field(default="super-secret-key", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiry_seconds: int = Field(default=3600, env="JWT_EXPIRY_SECONDS")
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
