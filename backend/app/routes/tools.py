from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.tool_service import get_all_tools, get_tool_by_id, create_tool, delete_tool

router = APIRouter(prefix="/tools", tags=["Tools"])

class ToolRequest(BaseModel):
    name: str
    material: Optional[str] = None
    diameter: Optional[float] = None
    flutes: Optional[int] = None
    max_rpm: Optional[int] = None
    max_feed_rate: Optional[float] = None

class ToolResponse(BaseModel):
    id: int
    name: str
    material: Optional[str]
    diameter: Optional[float]
    flutes: Optional[int]
    max_rpm: Optional[int]
    max_feed_rate: Optional[float]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ToolResponse])
def list_tools(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_all_tools(db)

@router.post("/", response_model=ToolResponse)
def add_tool(request: ToolRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_tool(db, request.name, request.material, request.diameter, request.flutes, request.max_rpm, request.max_feed_rate)

@router.delete("/{tool_id}")
def remove_tool(tool_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tool = delete_tool(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"message": "Tool deleted successfully"}