import models
from database import SessionLocal, engine
from auth import get_password_hash
from datetime import date, timedelta

def seed():
    db = SessionLocal()
    
    # Check if user already exists
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        print("Creating admin user...")
        hashed_password = get_password_hash("admin123")
        admin = models.User(username="admin", hashed_password=hashed_password)
        db.add(admin)
        db.commit()

    # Add dummy hotel
    hotel = db.query(models.Hotel).filter(models.Hotel.name == "Grand Plaza").first()
    if not hotel:
        print("Creating dummy hotel and room types...")
        hotel = models.Hotel(name="Grand Plaza", location="New York")
        db.add(hotel)
        db.commit()
        db.refresh(hotel)

        # Add room types
        deluxe = models.RoomType(name="Deluxe Room", base_rate=150.0, hotel_id=hotel.id)
        suite = models.RoomType(name="Executive Suite", base_rate=300.0, hotel_id=hotel.id)
        db.add(deluxe)
        db.add(suite)
        db.commit()
        db.refresh(deluxe)

        # Add initial rate adjustment for Deluxe
        adjustment = models.RateAdjustment(
            room_type_id=deluxe.id,
            adjustment_amount=20.0,
            effective_date=date.today() - timedelta(days=1),
            reason="Holiday Season Peak"
        )
        db.add(adjustment)
        db.commit()

    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
