from sqlalchemy.orm import Session
from app.models.project import Project

def get_projects_by_user(db: Session, user_id: int):
    return db.query(Project).filter(Project.owner_id == user_id).all()

def get_project_by_id(db: Session, project_id: int, user_id: int):
    return db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == user_id
    ).first()

def create_project(db: Session, name: str, description: str, user_id: int):
    project = Project(
        name=name,
        description=description,
        owner_id=user_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def delete_project(db: Session, project_id: int, user_id: int):
    project = get_project_by_id(db, project_id, user_id)
    if project:
        db.delete(project)
        db.commit()
    return project