from fastapi import FastAPI

app = FastAPI(title="Convergence Prediction Markets API")


@app.get("/")
async def root():
    return {"message": "Hello from Convergence Prediction Markets API"}


@app.get("/health")
async def health():
    return {"status": "ok"}
