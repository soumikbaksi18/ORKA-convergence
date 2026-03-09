"""LLM service: OpenAI, Claude, DeepSeek. Uses API keys from config (env)."""
from openai import OpenAI
import anthropic

from config import OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY


def _openai_chat(messages: list[dict], system: str | None = None) -> str:
    if not OPENAI_API_KEY:
        return "OpenAI API key is not configured. Add OPENAI_API_KEY to .env."
    client = OpenAI(api_key=OPENAI_API_KEY)
    msgs = [{"role": "system", "content": system}] + messages if system else messages
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=msgs,
        max_tokens=2048,
    )
    return (resp.choices[0].message.content or "").strip()


def _claude_chat(messages: list[dict], system: str | None = None) -> str:
    if not ANTHROPIC_API_KEY:
        return "Anthropic API key is not configured. Add ANTHROPIC_API_KEY to .env."
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    # Convert to Anthropic format: user/assistant only; system is separate
    system_text = system or ""
    last_content = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "system":
            system_text += "\n\n" + content
            continue
        last_content.append({"role": role, "content": content})
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=system_text or "You are a helpful prediction market analyst.",
        messages=last_content,
    )
    return (resp.content[0].text if resp.content else "").strip()


def _deepseek_chat(messages: list[dict], system: str | None = None) -> str:
    if not DEEPSEEK_API_KEY:
        return "DeepSeek API key is not configured. Add DEEPSEEK_API_KEY to .env."
    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
    msgs = [{"role": "system", "content": system}] + messages if system else messages
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=msgs,
        max_tokens=2048,
    )
    return (resp.choices[0].message.content or "").strip()


def chat_completion(
    model_id: str,
    messages: list[dict],
    system: str | None = None,
) -> str:
    """Run chat with the selected model. model_id: openai | claude | deepseek."""
    if model_id == "openai":
        return _openai_chat(messages, system)
    if model_id == "claude":
        return _claude_chat(messages, system)
    if model_id == "deepseek":
        return _deepseek_chat(messages, system)
    return f"Unknown model: {model_id}. Choose openai, claude, or deepseek."
