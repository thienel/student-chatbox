from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str
    openai_base_url: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o"
    openai_flashcard_model: str = "gpt-4o-mini"
    openai_exam_model: str = "gpt-4o-mini"

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "documents"

    ai_service_secret: str
    nestjs_url: str = "http://localhost:3000/api/v1"

    port: int = 8000

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
