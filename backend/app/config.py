from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ratebridge"
    SECRET_KEY: str = "changeme-in-production-use-random-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    SUPERADMIN_EMAIL: str = "superadmin@ratebridge.com"
    SUPERADMIN_PASSWORD: str = "superadmin123"
    FRONTEND_URL: str = "http://localhost:5173"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
