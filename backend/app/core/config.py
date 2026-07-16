from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    supabase_url: str = Field(default="http://localhost:54321", env="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    supabase_anon_key: str = Field(default="", env="SUPABASE_ANON_KEY")

    model_path: str = Field(default="model/mobilenetv2_finetuned_best.keras", env="MODEL_PATH")

    confidence_threshold: float = 60.0

    cors_origins: list[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
