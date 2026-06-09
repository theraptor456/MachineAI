from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.models.user import User
from app.gcode.parser import parse_gcode

router = APIRouter(prefix="/gcode", tags=["G-Code Analysis"])

class GCodeRequest(BaseModel):
    gcode_text: str

@router.post("/analyze")
def analyze_gcode(request: GCodeRequest, current_user: User = Depends(get_current_user)):
    if not request.gcode_text.strip():
        raise HTTPException(status_code=400, detail="G-Code text cannot be empty")
    result = parse_gcode(request.gcode_text)
    return {
        "total_lines": result.total_lines,
        "total_commands": result.total_commands,
        "rapid_moves": result.rapid_moves,
        "cutting_moves": result.cutting_moves,
        "max_feed_rate": result.max_feed_rate,
        "min_feed_rate": result.min_feed_rate,
        "max_spindle_speed": result.max_spindle_speed,
        "estimated_cutting_distance": round(result.estimated_cutting_distance, 4)
    }