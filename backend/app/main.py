from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.routes import auth, projects, gcode, tools, materials

app = FastAPI(
    title="MachineAI",
    description="Intelligent CNC Manufacturing Analysis Platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(gcode.router)
app.include_router(tools.router)
app.include_router(materials.router)

@app.get("/")
def root():
    return {"message": "MachineAI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}