# Convergence AI Analysis API

FastAPI backend for AI-powered market analysis: model selection (OpenAI, Claude, DeepSeek), chat with market context, risk tolerance, and investment amount.

## Setup

1. **Python**: Use Python 3.10+.

2. **Install dependencies**
   ```bash
   cd backend/ai
   pip install -r requirements.txt
   ```

3. **Configure API keys**  
   Copy `.env.example` to `.env` and add your keys:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   - `OPENAI_API_KEY` — [OpenAI API keys](https://platform.openai.com/api-keys)
   - `ANTHROPIC_API_KEY` — [Anthropic Console](https://console.anthropic.com/)
   - `DEEPSEEK_API_KEY` — [DeepSeek Platform](https://platform.deepseek.com/)

## Run

```bash
cd backend/ai
uvicorn main:app --reload --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## Frontend

The Next.js app proxies to this backend via `/api/ai/models` and `/api/ai/chat`. Set `AI_API_URL=http://localhost:8000` in the frontend env if the backend runs on a different host (default is 8000).
