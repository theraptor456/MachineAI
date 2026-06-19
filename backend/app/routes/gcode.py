from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.gcode.parser import parse_gcode
from app.services.project_service import get_project_by_id
from app.services.analysis_service import create_analysis_result

router = APIRouter(prefix="/gcode", tags=["G-Code Analysis"])

class GCodeRequest(BaseModel):
    gcode_text: str
    project_id: Optional[int] = None

@router.post("/analyze")
def analyze_gcode(request: GCodeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not request.gcode_text.strip():
        raise HTTPException(status_code=400, detail="G-Code text cannot be empty")

    result = parse_gcode(request.gcode_text)

    estimated_runtime = round(result.estimated_cutting_distance / max(result.max_feed_rate, 1) * 60, 2) if result.max_feed_rate else 0
    estimated_cost = round(estimated_runtime * 0.5, 2)

    response = {
        "total_lines": result.total_lines,
        "total_commands": result.total_commands,
        "rapid_moves": result.rapid_moves,
        "cutting_moves": result.cutting_moves,
        "max_feed_rate": result.max_feed_rate,
        "min_feed_rate": result.min_feed_rate,
        "max_spindle_speed": result.max_spindle_speed,
        "estimated_cutting_distance": round(result.estimated_cutting_distance, 4),
        "estimated_runtime_minutes": estimated_runtime,
        "estimated_cost": estimated_cost
    }

    if request.project_id:
        project = get_project_by_id(db, request.project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        create_analysis_result(
            db,
            project_id=request.project_id,
            estimated_runtime=estimated_runtime,
            estimated_tool_wear=0.0,
            surface_finish_quality="Unknown",
            manufacturing_risk="Low",
            estimated_cost=estimated_cost
        )

    return response
