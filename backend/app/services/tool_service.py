from sqlalchemy.orm import Session
from app.models.tool import Tool

def get_all_tools(db: Session):
    return db.query(Tool).all()

def get_tool_by_id(db: Session, tool_id: int):
    return db.query(Tool).filter(Tool.id == tool_id).first()

def create_tool(db: Session, name: str, material: str, diameter: float, flutes: int, max_rpm: int, max_feed_rate: float):
    tool = Tool(
        name=name,
        material=material,
        diameter=diameter,
        flutes=flutes,
        max_rpm=max_rpm,
        max_feed_rate=max_feed_rate
    )
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool

def delete_tool(db: Session, tool_id: int):
    tool = get_tool_by_id(db, tool_id)
    if tool:
        db.delete(tool)
        db.commit()
    return tool