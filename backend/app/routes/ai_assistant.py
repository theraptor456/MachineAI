from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ai_service import get_ai_response, identify_item_from_image
from app.services.material_service import create_material
from app.services.tool_service import create_tool

router = APIRouter(prefix="/ai-assistant", tags=["AI CNC Assistant"])


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    material: Optional[str] = None
    tool_name: Optional[str] = None


@router.post("/chat")
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = get_ai_response(
        request.message,
        request.conversation_history,
        material=request.material,
        tool_name=request.tool_name
    )
    return result



@router.post("/identify-image")
async def identify_image(
    item_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if item_type not in ("tool", "material"):
        raise HTTPException(status_code=400, detail="item_type must be 'tool' or 'material'")

    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    try:
        data = identify_item_from_image(image_bytes, mime_type, item_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not identify item from image: {str(e)}")

    if item_type == "tool":
        created = create_tool(
            db,
            data.get("name", "Unidentified Tool"),
            data.get("material"),
            data.get("diameter"),
            data.get("flutes"),
            data.get("max_rpm"),
            None
        )
    else:
        created = create_material(
            db,
            data.get("name", "Unidentified Material"),
            data.get("hardness"),
            data.get("tensile_strength"),
            data.get("recommended_feed_rate"),
            data.get("recommended_rpm")
        )

    return {"identified": data, "created": True, "item_type": item_type, "id": created.id}
