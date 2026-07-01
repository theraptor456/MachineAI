from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    estimated_runtime = Column(Float)
    estimated_tool_wear = Column(Float)
    surface_finish_quality = Column(String)
    manufacturing_risk = Column(String)
    estimated_cost = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="analyses")