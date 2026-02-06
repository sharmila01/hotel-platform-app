from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    status = Column(String, default="active")

    room_types = relationship("RoomType", back_populates="hotel", cascade="all, delete-orphan")

class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    name = Column(String)
    base_rate = Column(Float)

    hotel = relationship("Hotel", back_populates="room_types")
    adjustments = relationship("RateAdjustment", back_populates="room_type", cascade="all, delete-orphan")

class RateAdjustment(Base):
    __tablename__ = "rate_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id"))
    adjustment_amount = Column(Float)
    effective_date = Column(Date)
    reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room_type = relationship("RoomType", back_populates="adjustments")
