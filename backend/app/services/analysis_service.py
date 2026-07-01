from sqlalchemy.orm import Session
from app.models.analysis import AnalysisResult

def create_analysis_result(db: Session, project_id: int, estimated_runtime: float, estimated_tool_wear: float, surface_finish_quality: str, manufacturing_risk: str, estimated_cost: float):
    result = AnalysisResult(
        project_id=project_id,
        estimated_runtime=estimated_runtime,
        estimated_tool_wear=estimated_tool_wear,
        surface_finish_quality=surface_finish_quality,
        manufacturing_risk=manufacturing_risk,
        estimated_cost=estimated_cost
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

def get_analyses_by_project(db: Session, project_id: int):
    return db.query(AnalysisResult).filter(AnalysisResult.project_id == project_id).all()
