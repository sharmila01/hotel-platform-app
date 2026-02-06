from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import List, Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class RateAdjustmentBase(BaseModel):
    adjustment_amount: float
    effective_date: date
    reason: str

class RateAdjustmentCreate(RateAdjustmentBase):
    room_type_id: int

class RateAdjustment(RateAdjustmentBase):
    id: int
    room_type_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RoomTypeBase(BaseModel):
    name: str
    base_rate: float

class RoomTypeCreate(RoomTypeBase):
    hotel_id: int

class RoomType(RoomTypeBase):
    id: int
    hotel_id: int
    effective_rate: Optional[float] = None
    adjustments: List[RateAdjustment] = []
    model_config = ConfigDict(from_attributes=True)

class HotelBase(BaseModel):
    name: str
    location: str

class HotelCreate(HotelBase):
    pass

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

class Hotel(HotelBase):
    id: int
    status: Optional[str] = "active"
    room_types: List[RoomType] = []
    model_config = ConfigDict(from_attributes=True)
