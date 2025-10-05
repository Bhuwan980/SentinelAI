from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ---------------------- Core Configuration ----------------------
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SERP_API_KEY: str

    # ---------------------- Email Configuration ----------------------
    email_user: str
    email_pass: str
    email_host: str = "smtp.gmail.com"
    email_port: int = 587

    class Config:
        env_file = ".env"
        extra = "ignore"  # allows other env vars not listed here


settings = Settings()