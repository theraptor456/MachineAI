from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.project_service import (
    get_projects_by_user,
    get_project_by_id,
    create_project,
    delete_project
)

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_projects_by_user(db, current_user.id)

@router.post("/", response_model=ProjectResponse)
def create_new_project(request: ProjectRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_project(db, request.name, request.description, current_user.id)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_by_id(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
def remove_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = delete_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}