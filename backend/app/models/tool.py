from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    material = Column(String)
    diameter = Column(Float)
    flutes = Column(Integer)
    max_rpm = Column(Integer)
    max_feed_rate = Column(Float)