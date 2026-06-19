from sqlalchemy.orm import Session
from app.models.material import Material

def get_all_materials(db: Session):
    return db.query(Material).all()

def get_material_by_id(db: Session, material_id: int):
    return db.query(Material).filter(Material.id == material_id).first()

def create_material(db: Session, name: str, hardness: float, tensile_strength: float, recommended_feed_rate: float, recommended_rpm: int):
    material = Material(
        name=name,
        hardness=hardness,
        tensile_strength=tensile_strength,
        recommended_feed_rate=recommended_feed_rate,
        recommended_rpm=recommended_rpm
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material

def delete_material(db: Session, material_id: int):
    material = get_material_by_id(db, material_id)
    if material:
        db.delete(material)
        db.commit()
    return material