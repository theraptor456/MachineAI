from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.material_service import get_all_materials, get_material_by_id, create_material, delete_material

router = APIRouter(prefix="/materials", tags=["Materials"])

class MaterialRequest(BaseModel):
    name: str
    hardness: Optional[float] = None
    tensile_strength: Optional[float] = None
    recommended_feed_rate: Optional[float] = None
    recommended_rpm: Optional[int] = None

class MaterialResponse(BaseModel):
    id: int
    name: str
    hardness: Optional[float]
    tensile_strength: Optional[float]
    recommended_feed_rate: Optional[float]
    recommended_rpm: Optional[int]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[MaterialResponse])
def list_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_all_materials(db)

@router.post("/", response_model=MaterialResponse)
def add_material(request: MaterialRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_material(db, request.name, request.hardness, request.tensile_strength, request.recommended_feed_rate, request.recommended_rpm)

@router.delete("/{material_id}")
def remove_material(material_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = delete_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted successfully"}