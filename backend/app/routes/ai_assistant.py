from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ai_service import get_ai_response

router = APIRouter(prefix="/ai-assistant", tags=["AI CNC Assistant"])


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


@router.post("/chat")
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = get_ai_response(request.message, request.conversation_history)
    return result
