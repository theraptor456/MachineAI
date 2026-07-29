from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.gcode.parser import parse_gcode
from app.gcode.tool_wear import predict_tool_wear
from app.gcode.validate import validate_gcode
from app.services.project_service import get_project_by_id
from app.services.analysis_service import create_analysis_result

router = APIRouter(prefix="/gcode", tags=["G-Code Analysis"])

class GCodeRequest(BaseModel):
    gcode_text: str
    project_id: Optional[int] = None
    material: Optional[str] = "unknown"
    depth_of_cut: Optional[float] = 1.0
    tool_name: Optional[str] = None

@router.post("/analyze")
def analyze_gcode(
    request: GCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.gcode_text.strip():
        raise HTTPException(status_code=400, detail="G-Code text cannot be empty")

    result = parse_gcode(request.gcode_text)

    runtime = result.estimated_runtime_minutes
    estimated_cost = round(runtime * 0.5, 2)

    tool_wear = predict_tool_wear(
        runtime_minutes=runtime,
        material=request.material or "unknown",
        depth_of_cut=request.depth_of_cut or 1.0,
        cutting_distance=result.estimated_cutting_distance
    )

    if tool_wear["wear_score"] < 20:
        risk = "Low"
    elif tool_wear["wear_score"] < 50:
        risk = "Moderate"
    elif tool_wear["wear_score"] < 75:
        risk = "High"
    else:
        risk = "Critical"

    response = {
        "total_lines": result.total_lines,
        "total_commands": result.total_commands,
        "rapid_moves": result.rapid_moves,
        "cutting_moves": result.cutting_moves,
        "max_feed_rate": result.max_feed_rate,
        "min_feed_rate": result.min_feed_rate,
        "max_spindle_speed": result.max_spindle_speed,
        "estimated_cutting_distance": round(result.estimated_cutting_distance, 4),
        "estimated_rapid_distance": round(result.estimated_rapid_distance, 4),
        "estimated_runtime_minutes": runtime,
        "estimated_cost": estimated_cost,
        "tool_wear": tool_wear,
        "manufacturing_risk": risk,
        "material": request.material,
        "tool_name": request.tool_name
    }

    if request.project_id:
        project = get_project_by_id(db, request.project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        create_analysis_result(
            db,
            project_id=request.project_id,
            estimated_runtime=runtime,
            estimated_tool_wear=tool_wear["wear_score"],
            surface_finish_quality=tool_wear["wear_level"],
            manufacturing_risk=risk,
            estimated_cost=estimated_cost
        )

    return response



class SimulateRequest(BaseModel):
    gcode_text: str


@router.post("/simulate")
def simulate_gcode(
    request: SimulateRequest,
    current_user: User = Depends(get_current_user)
):
    if not request.gcode_text.strip():
        raise HTTPException(status_code=400, detail="G-Code text cannot be empty")

    result = parse_gcode(request.gcode_text)
    warnings = validate_gcode(result)

    moves = [
        {
            "line_number": cmd.line_number,
            "command": cmd.command,
            "type": "rapid" if cmd.command == "G0" else ("cutting" if cmd.command == "G1" else "other"),
            "start": {"x": cmd.start_x, "y": cmd.start_y, "z": cmd.start_z},
            "end": {"x": cmd.end_x, "y": cmd.end_y, "z": cmd.end_z},
            "feed_rate": cmd.feed_rate,
            "spindle_on": cmd.spindle_on,
        }
        for cmd in result.commands
        if cmd.command in ("G0", "G1")
    ]

    return {
        "moves": moves,
        "warnings": warnings,
        "total_moves": len(moves),
        "error_count": len([w for w in warnings if w["severity"] == "error"]),
        "warning_count": len([w for w in warnings if w["severity"] == "warning"]),
    }
