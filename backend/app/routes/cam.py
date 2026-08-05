from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.core.dependencies import get_current_user
from app.models.user import User
from app.cam.stl_to_gcode import load_stl_geometry, generate_roughing_gcode

router = APIRouter(prefix="/cam", tags=["CAM / STL to G-Code"])


@router.post("/generate-from-stl")
async def generate_from_stl(
    file: UploadFile = File(...),
    stock_margin: float = Form(5.0),
    depth_per_pass: float = Form(2.0),
    tool_diameter: float = Form(6.0),
    feed_rate: float = Form(800.0),
    plunge_rate: float = Form(300.0),
    spindle_speed: int = Form(10000),
    safe_z: float = Form(10.0),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".stl"):
        raise HTTPException(status_code=400, detail="File must be a .stl file")

    file_bytes = await file.read()

    try:
        geometry = load_stl_geometry(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse STL file: {str(e)}")

    try:
        gcode = generate_roughing_gcode(
            geometry,
            stock_margin=stock_margin,
            depth_per_pass=depth_per_pass,
            tool_diameter=tool_diameter,
            feed_rate=feed_rate,
            plunge_rate=plunge_rate,
            spindle_speed=spindle_speed,
            safe_z=safe_z,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"G-Code generation failed: {str(e)}")

    return {
        "gcode": gcode,
        "bounding_box": geometry["bounding_box"],
        "line_count": len(gcode.split("\n"))
    }
