from fastapi import FastAPI
from app.core.database import engine

app = FastAPI(
    title="MachineAI",
    description="Intelligent CNC Manufacturing Analysis Platform",
    version="0.1.0"
)

@app.get("/")
def root():
    return {"message": "MachineAI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}