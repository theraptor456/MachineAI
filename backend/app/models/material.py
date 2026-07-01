from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    hardness = Column(Float)
    tensile_strength = Column(Float)
    recommended_feed_rate = Column(Float)
    recommended_rpm = Column(Integer)