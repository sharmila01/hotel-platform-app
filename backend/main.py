from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from typing import List
import models, schemas, auth, database
from database import engine

# Create tables (Alembic will be used later, but this helps initial dev)
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hotel Admin API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to calculate effective rate
def get_effective_rate(db: Session, room_type: models.RoomType):
    today = date.today()
    latest_adjustment = db.query(models.RateAdjustment)\
        .filter(models.RateAdjustment.room_type_id == room_type.id,
                models.RateAdjustment.effective_date <= today)\
        .order_by(models.RateAdjustment.effective_date.desc())\
        .first()
    
    adjustment_amount = latest_adjustment.adjustment_amount if latest_adjustment else 0.0
    return room_type.base_rate + adjustment_amount

# Auth Endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Hotel Endpoints
@app.post("/hotels", response_model=schemas.Hotel)
def create_hotel(hotel: schemas.HotelCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_hotel = models.Hotel(**hotel.model_dump())
    db.add(db_hotel)
    db.commit()
    db.refresh(db_hotel)
    return db_hotel

@app.get("/hotels", response_model=List[schemas.Hotel])
def read_hotels(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Hotel).all()

@app.get("/hotels/{hotel_id}", response_model=schemas.Hotel)
def read_hotel(hotel_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Calculate effective rates for room types
    for rt in db_hotel.room_types:
        rt.effective_rate = get_effective_rate(db, rt)
    
    return db_hotel

@app.put("/hotels/{hotel_id}", response_model=schemas.Hotel)
def update_hotel(hotel_id: int, hotel: schemas.HotelUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    update_data = hotel.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hotel, key, value)
    
    db.commit()
    db.refresh(db_hotel)
    return db_hotel

@app.delete("/hotels/{hotel_id}")
def delete_hotel(hotel_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if db_hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    db.delete(db_hotel)
    db.commit()
    return {"detail": "Hotel deleted"}

# Room Type Endpoints
@app.post("/room-types", response_model=schemas.RoomType)
def create_room_type(room_type: schemas.RoomTypeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_room_type = models.RoomType(**room_type.model_dump())
    db.add(db_room_type)
    db.commit()
    db.refresh(db_room_type)
    db_room_type.effective_rate = db_room_type.base_rate
    return db_room_type

@app.put("/room-types/{room_type_id}", response_model=schemas.RoomType)
def update_room_type(room_type_id: int, room_type: schemas.RoomTypeBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_room_type = db.query(models.RoomType).filter(models.RoomType.id == room_type_id).first()
    if db_room_type is None:
        raise HTTPException(status_code=404, detail="Room Type not found")
    
    update_data = room_type.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_room_type, key, value)
    
    db.commit()
    db.refresh(db_room_type)
    db_room_type.effective_rate = get_effective_rate(db, db_room_type)
    return db_room_type

@app.delete("/room-types/{room_type_id}")
def delete_room_type(room_type_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_room_type = db.query(models.RoomType).filter(models.RoomType.id == room_type_id).first()
    if db_room_type is None:
        raise HTTPException(status_code=404, detail="Room Type not found")
    db.delete(db_room_type)
    db.commit()
    return {"detail": "Room Type deleted"}

# Rate Adjustment Endpoints
@app.post("/rate-adjustments", response_model=schemas.RateAdjustment)
def create_rate_adjustment(adjustment: schemas.RateAdjustmentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_adjustment = models.RateAdjustment(**adjustment.model_dump())
    db.add(db_adjustment)
    db.commit()
    db.refresh(db_adjustment)
    return db_adjustment

@app.get("/room-types/{room_type_id}/history", response_model=List[schemas.RateAdjustment])
def get_adjustment_history(room_type_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.RateAdjustment).filter(models.RateAdjustment.room_type_id == room_type_id).order_by(models.RateAdjustment.created_at.desc()).all()
