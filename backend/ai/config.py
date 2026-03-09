"""Load config from environment."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend/ai directory
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()

# Model identifiers for the dropdown (best-of from each provider)
MODELS = [
    {"id": "openai", "name": "OpenAI (GPT-4o)", "provider": "openai"},
    {"id": "claude", "name": "Claude (Anthropic)", "provider": "claude"},
    {"id": "deepseek", "name": "DeepSeek", "provider": "deepseek"},
]

def get_model_by_id(model_id: str) -> dict | None:
    for m in MODELS:
        if m["id"] == model_id:
            return m
    return None
