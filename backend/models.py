import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from database import Base  # Absolute import

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_no = Column(String, unique=True, nullable=False)
    address = Column(String)
    state = Column(String)
    country = Column(String)
    blood_group = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SecurityStation(Base):
    __tablename__ = "security_stations"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    station_type = Column(String) # 'POLICE' or 'AMOTEKUN'
    latitude = Column(Float)
    longitude = Column(Float)
    state = Column(String)
    
    
    
    
    




class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    # Use UUID for the primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String)  # Stored directly for faster dashboard rendering
    incident_number = Column(String, unique=True)  # e.g., SOS-A1B2C3
    
    # Merged Coordinates
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    
    # Status Machine: PENDING -> HELP_ON_THE_WAY -> RESOLVED
    status = Column(String, default="PENDING")
    
    # Responder Tracking
    claimed_by_type = Column(String, nullable=True)  # 'POLICE', 'FIRE', 'MEDICAL'
    responder_name = Column(String, nullable=True)   # Name of the unit responding
    
    # Real-time tracking fields for mapping - THESE WERE MISSING
    responder_lat = Column(Float, nullable=True)      # Live location of responder
    responder_lon = Column(Float, nullable=True)      # Live location of responder
    estimated_arrival_time = Column(String, nullable=True)
    
    # Timestamps (Python 3.11+ compatible)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # History visibility
    is_deleted_by_user = Column(Boolean, default=False)
    
    # User confirmation
    user_confirmed_arrival = Column(Boolean, default=False)

# class EmergencyAlert(Base):
#     __tablename__ = "emergency_alerts"

#     # Use UUID for the primary key
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     username = Column(String) # Stored directly for faster dashboard rendering
#     incident_number = Column(String, unique=True) # e.g., SOS-A1B2C3
    
#     # Merged Coordinates
#     lat = Column(Float, nullable=False)
#     lon = Column(Float, nullable=False)
    
#     # Status Machine: PENDING -> ATTENDING -> RESOLVED
#     status = Column(String, default="PENDING")
    
#     # Responder Tracking
#     claimed_by_type = Column(String, nullable=True) # 'POLICE' or 'AMOTEKUN'
#     responder_name = Column(String, nullable=True)  # Name of the unit responding
    
#     # Timestamps (Python 3.11+ compatible)
#     created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
#     responded_at = Column(DateTime, nullable=True)
#     resolved_at = Column(DateTime, nullable=True)
    
#     # History visibility
#     is_deleted_by_user = Column(Boolean, default=False)

#     # Real-time tracking fields for mapping
#     user_confirmed_arrival = Column(Boolean, default=False)
#     responder_lat = Column(Float, nullable=True) # Live location of the police car
#     responder_lon = Column(Float, nullable=True)
#     estimated_arrival_time = Column(String, nullable=True)
    






    

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    phone_no = Column(String, nullable=False)
    email = Column(String, nullable=True)

# Note: The old 'Alert' and 'PolicePost' tables are replaced by the logic above.
# Use EmergencyAlert for all active SOS tracking.



class PolicePost(Base):
    __tablename__ = "police_posts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    area_command = Column(String(100), nullable=False)  # ✅ Add this field
    phone_no = Column(String(20), nullable=False)
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())




# Add this to your models.py
# class PolicePost(Base):
#     __tablename__ = "police_posts"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, index=True)
#     phone = Column(String)
#     # This stores the GPS point (Longitude, Latitude)
#     location = Column(Geography(geometry_type='POINT', srid=4326))





# from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
# from sqlalchemy.sql import func
# from geoalchemy2 import Geography
# from database import Base  # Absolute import


# import uuid
# from datetime import datetime, timezone  # Add timezone here
# from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
# from sqlalchemy.dialects.postgresql import UUID




# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     firstname = Column(String, nullable=False)
#     lastname = Column(String, nullable=False)
#     username = Column(String, unique=True, index=True, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=False)
#     phone_no = Column(String, unique=True, nullable=False)
#     address = Column(String)
#     state = Column(String)
#     country = Column(String)
    
#     # Useful future info
#     blood_group = Column(String, nullable=True)
#     emergency_contact_name = Column(String, nullable=True)
#     emergency_contact_phone = Column(String, nullable=True)
    
    
#     # This is the line that was likely missing or named differently!
#     hashed_password = Column(String)
    
#     created_at = Column(DateTime(timezone=True), server_default=func.now())    
        
    
    


# class PolicePost(Base):
#     __tablename__ = "police_posts"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, index=True)
#     # Geography_point: (Longitude, Latitude)
#     location = Column(Geography(geometry_type='POINT', srid=4326))
#     phone = Column(String)




# class SecurityStation(Base):
#     __tablename__ = "security_stations"
#     id = Column(Integer, primary_key=True)
#     name = Column(String)
#     station_type = Column(String) # 'POLICE' or 'AMOTEKUN'
#     latitude = Column(Float)
#     longitude = Column(Float)
#     state = Column(String)





# class Alert(Base):
#     __tablename__ = "alerts"
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     post_id = Column(Integer, ForeignKey("police_posts.id"), nullable=True)
#     lat = Column(Float)
#     lon = Column(Float)
#     status = Column(String, default="PENDING") # PENDING, ACKNOWLEDGED, RESOLVED
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
    
    
    
    
    
    
    
# class EmergencyContact(Base):
#     __tablename__ = "emergency_contacts"
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     name = Column(String, nullable=False)
#     phone_no = Column(String, nullable=False)
#     email = Column(String, nullable=True)
    
    
#     username = Column(String) # For quick display on maps
#     incident_number = Column(String, unique=True) # e.g., SOS-2024-001
    
#     latitude = Column(Float)
#     longitude = Column(Float)
    
#     # Status levels: PENDING -> ATTENDING -> RESOLVED
#     status = Column(String, default="PENDING") 
    
#     # Tracking who responds
#     claimed_by_type = Column(String, nullable=True) # 'POLICE' or 'AMOTEKUN'
#     claimed_by_id = Column(Integer, nullable=True)
#     responder_name = Column(String, nullable=True)  # Name of the officer/unit
    
#     # Timestamps
#     created_at = Column(DateTime, default=datetime.utcnow)
#     responded_at = Column(DateTime, nullable=True) # When agency clicks "Help on the way"
#     resolved_at = Column(DateTime, nullable=True)  # When user clicks "Resolve"
    
#     # Visibility - Soft delete for user history
#     is_deleted_by_user = Column(Boolean, default=False)
    
    
    
    
    

# class EmergencyAlert(Base):
#     __tablename__ = "emergency_alerts"

#     # Use 'uuid' here because of your import above
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id = Column(Integer)
#     username = Column(String)
#     incident_number = Column(String, unique=True)
    
#     # Coordinates (Merged from your 'alerts' table)
#     lat = Column(Float, nullable=False)
#     lon = Column(Float, nullable=False)
    
#     status = Column(String, default="PENDING")
#     claimed_by_type = Column(String, nullable=True) # POLICE or AMOTEKUN
    
 
#     # To this (Best practice for Python 3.11+):
#     created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
#     resolved_at = Column(DateTime, nullable=True)
