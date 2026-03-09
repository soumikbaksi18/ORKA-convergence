from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chat

app = FastAPI(title="Convergence AI Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "Convergence AI Analysis API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
