from fastapi import FastAPI
from app.core.database import engine
from app.routes import auth, projects, gcode

app = FastAPI(
    title="MachineAI",
    description="Intelligent CNC Manufacturing Analysis Platform",
    version="0.1.0"
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(gcode.router)

@app.get("/")
def root():
    return {"message": "MachineAI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}