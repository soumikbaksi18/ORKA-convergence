"""Chat / analysis API: model selection, market context, risk & amount."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import MODELS, get_model_by_id
from services.llm import chat_completion

router = APIRouter(prefix="/api", tags=["ai"])


class OutcomeInfo(BaseModel):
    label: str
    ticker: str
    last_price: int | None = None  # cents 0-100


class MarketContext(BaseModel):
    event_title: str
    outcomes: list[OutcomeInfo] = Field(default_factory=list)


class ChatMessage(BaseModel):
    role: str = "user"
    content: str


class DataSourceInfo(BaseModel):
    source: str
    value: str
    link: str | None = None


class ChatRequest(BaseModel):
    model: str = Field(..., description="openai | claude | deepseek")
    messages: list[ChatMessage] = Field(default_factory=list)
    market: MarketContext | None = None
    risk_tolerance: str | None = None  # e.g. "low", "medium", "high"
    amount_usd: float | None = None
    data_sources: list[DataSourceInfo] | None = None  # X accounts, Reddit channels, etc.


class ChatResponse(BaseModel):
    reply: str
    model_used: str


def _build_system_prompt(
    market: MarketContext | None,
    risk_tolerance: str | None,
    amount_usd: float | None,
    data_sources: list[DataSourceInfo] | None = None,
) -> str:
    parts = [
        "You are a helpful AI analyst for prediction markets. You help users understand markets, "
        "get summaries, think about social sentiment (X/Twitter, Reddit, Instagram), and consider "
        "risk and position sizing. Be concise and practical.",
        "",
        "**Formatting:** Your reply is rendered as Markdown. When relevant, include 1–3 clickable news or data links "
        "using markdown: [link text](https://...). Use trusted sources (e.g. Reuters, Bloomberg, official exchanges). "
        "You may also include one image URL as markdown ![](https://...) if it adds value (e.g. a chart from a trusted "
        "domain). Only use https URLs.",
    ]
    if market:
        parts.append("\n\n**Current market:**")
        parts.append(f"- Event: {market.event_title}")
        for o in market.outcomes:
            pct = f" {o.last_price}%" if o.last_price is not None else ""
            parts.append(f"  - {o.label}{pct}")
    if risk_tolerance:
        parts.append(f"\n**User risk tolerance:** {risk_tolerance}")
    if amount_usd is not None and amount_usd > 0:
        parts.append(f"\n**User investment amount:** ${amount_usd:.2f}")
    if data_sources:
        parts.append("\n**User data sources (accounts/channels/symbols they track):**")
        for ds in data_sources:
            line = f"- {ds.source}: {ds.value}"
            if ds.link:
                line += f" ({ds.link})"
            parts.append(line)
    return "\n".join(parts)


@router.get("/models")
def list_models():
    """List available models for the dropdown."""
    return {"models": MODELS}


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """Send a message and get an AI reply. Optional: market context, risk_tolerance, amount_usd."""
    model_info = get_model_by_id(req.model)
    if not model_info:
        raise HTTPException(status_code=400, detail=f"Unknown model: {req.model}. Use openai, claude, or deepseek.")
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    system = _build_system_prompt(req.market, req.risk_tolerance, req.amount_usd, req.data_sources)
    reply = chat_completion(req.model, messages, system=system)
    return ChatResponse(reply=reply, model_used=req.model)
