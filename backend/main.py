import uuid
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Request, Body
from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from sqlalchemy import text
from jose import jwt, JWTError
from passlib.context import CryptContext
from geoalchemy2.functions import ST_Distance, ST_GeogFromText

import models, schemas, database
import asyncio


# --- CONFIGURATION ---
SECRET_KEY = "YOUR_SUPER_SECRET_KEY" 
ALGORITHM = "HS256"

app = FastAPI(title="Uncle Mayor SOS API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Your Vite/React development server
        "http://localhost:3000",   # Alternative React dev server
        "https://sos-alert-app-git-master-ayeniayodeji2009s-projects.vercel.app",
        "https://*.vercel.app",
        # "https://sos-alert-app.vercel.app/",  # Your Render frontend URL (replace with actual)
        # You can also use ["*"] to allow all origins (not recommended for production)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=600,  # Cache preflight for 10 minutes
)



# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )




# Add logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger = logging.getLogger("uvicorn")
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    
    # For POST/PATCH requests, log the body
    if request.method in ["POST", "PATCH"]:
        body = await request.body()
        logger.info(f"Body: {body}")
    
    response = await call_next(request)
    return response








# Create tables on startup
models.Base.metadata.create_all(bind=database.engine)

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.admin_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        # Broadcast to all connections (both regular and admin)
        for connection in self.active_connections + self.admin_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()




# class ConnectionManager:
#     def __init__(self):
#         self.admin_connections: List[WebSocket] = []
#         # Keyed by Alert UUID string
#         self.user_connections: dict[str, List[WebSocket]] = {}

#     async def connect_admin(self, websocket: WebSocket):
#         await websocket.accept()
#         self.admin_connections.append(websocket)

#     async def connect_user(self, websocket: WebSocket, alert_id: str):
#         await websocket.accept()
#         if alert_id not in self.user_connections:
#             self.user_connections[alert_id] = []
#         self.user_connections[alert_id].append(websocket)

#     def disconnect(self, websocket: WebSocket):
#         if websocket in self.admin_connections:
#             self.admin_connections.remove(websocket)

#     async def broadcast(self, message: dict):
#         """Broadcasts to all admins (Police/Amotekun/SuperAdmin)"""
#         for connection in self.admin_connections:
#             try:
#                 await connection.send_json(message)
#             except:
#                 self.admin_connections.remove(connection)

#     async def notify_user(self, alert_id: str, message: dict):
#         if alert_id in self.user_connections:
#             for connection in self.user_connections[alert_id]:
#                 try:
#                     await connection.send_json(message)
#                 except:
#                     self.user_connections[alert_id].remove(connection)

# manager = ConnectionManager()






# --- WEBSOCKET ENDPOINTS ---
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    # Regular user/responder connection
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)




@app.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    # Admin connection for dashboard
    await manager.connect_admin(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        
        

@app.websocket("/ws/status/{alert_id}")
async def websocket_user_status(websocket: WebSocket, alert_id: str):
    await manager.connect_user(websocket, alert_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- AUTH HELPERS ---
def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# --- BACKGROUND TASKS ---
def notify_emergency_contacts(user_id: int, lat: float, lon: float, db: Session):
    contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user_id).all()
    for contact in contacts:
        print(f"SMS TO {contact.phone_no}: EMERGENCY! User at {lat}, {lon}")

# --- API ENDPOINTS ---

@app.get("/")
def root():
    return {"message": "SOS System API is Live"}

@app.post("/users/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    hashed_pw = pwd_context.hash(user.password)
    user_dict = user.model_dump(exclude={"password"})
    new_user = models.User(**user_dict, hashed_password=hashed_pw)
    # db.add(new_user)
    # db.commit()
    # db.refresh(new_user)
    # return new_user
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A user with this phone number or email already exists"
        )

@app.post("/users/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")
    
    token = create_access_token({"sub": user.username, "id": user.id})
    return {"access_token": token, "token_type": "bearer"}

# --- SOS CORE LOGIC ---

@app.post("/alerts/trigger", response_model=schemas.AlertResponse)
async def trigger_sos(alert_data: schemas.AlertCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    new_alert = models.EmergencyAlert(
        user_id=alert_data.user_id,
        username=alert_data.username,
        lat=alert_data.lat,
        lon=alert_data.lon,
        status="PENDING",
        incident_number=f"SOS-{uuid.uuid4().hex[:6].upper()}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # Broadcast to dashboards
    alert_payload = {
        "event": "NEW_SOS",
        "alert": {
            "id": str(new_alert.id),
            "username": new_alert.username,
            "lat": new_alert.lat,
            "lon": new_alert.lon,
            "incident_number": new_alert.incident_number,
            "status": new_alert.status
        }
    }
    await manager.broadcast(alert_payload)
    
    background_tasks.add_task(notify_emergency_contacts, new_alert.user_id, new_alert.lat, new_alert.lon, db)
    return new_alert

@app.get("/admin/alerts/active", response_model=List[schemas.AlertResponse])
def get_active_alerts(db: Session = Depends(database.get_db)):
    return db.query(models.EmergencyAlert).filter(models.EmergencyAlert.status != "RESOLVED").order_by(models.EmergencyAlert.created_at.desc()).all()








@app.patch("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: UUID, db: Session = Depends(database.get_db)):
    alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()

    await manager.broadcast({
        "event": "INCIDENT_RESOLVED",
        "alert_id": str(alert_id),
        "incident_number": alert.incident_number
    })
    return {"message": "Incident resolved"}

# --- ADMIN STATS & USERS ---

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(database.get_db)):
    return {
        "totalUsers": db.query(models.User).count(),
        "totalAlerts": db.query(models.EmergencyAlert).count(),
        "pendingAlerts": db.query(models.EmergencyAlert).filter(models.EmergencyAlert.status == "PENDING").count()
    }

@app.get("/admin/users", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@app.get("/health")
def health_check():
    return {"status": "healthy"}




@app.get("/alerts/history/{user_id}", response_model=List[schemas.AlertHistory])
def get_user_alert_history(user_id: int, db: Session = Depends(database.get_db)):
    # Only show alerts that the user hasn't "soft-deleted"
    return db.query(models.EmergencyAlert).filter(
        models.EmergencyAlert.user_id == user_id,
        models.EmergencyAlert.is_deleted_by_user == False
    ).order_by(models.EmergencyAlert.created_at.desc()).all()



@app.get("/users/me", response_model=schemas.UserOut)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user







@app.get("/alerts/nearest")
def get_nearest_station(lat: float, lon: float, db: Session = Depends(database.get_db)):
    try:
        user_location = f"POINT({lon} {lat})"
        
        # Look for the closest station in the DB
        nearest = db.query(models.PolicePost).order_by(
            ST_Distance(models.PolicePost.location, ST_GeogFromText(user_location))
        ).first()

        if nearest:
            return {
                "station_name": nearest.name,
                "phone": nearest.phone
            }
    except Exception as e:
        print(f"Nearest station lookup failed: {e}")

    # FALLBACK: If DB is empty or has an error, don't crash the SOS app!
    return {
        "station_name": "Lagos State Emergency Center",
        "phone": "767" 
    }














# In your main.py
@app.patch("/alerts/{alert_id}/respond")
async def respond_to_alert(
    alert_id: str,
    data: schemas.ResponderUpdate = Body(...),  # Use the schema instead of manual parsing
    db: Session = Depends(database.get_db)
):
    
    #  # Parse the JSON body
    # body = await request.json()
    print(f"Received body: {data}")  # Debug print
    
    
    try:
        uuid_obj = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    # Find the alert
    alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == uuid_obj).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update status and Rescuer GPS
    alert.status = "HELP_ON_THE_WAY"
    alert.claimed_by_type = data.responder_type
    alert.responder_lat = data.responder_lat
    alert.responder_lon = data.responder_lon
    
    db.commit()
    db.refresh(alert)
    
    # Notify everyone via WebSocket
    await manager.broadcast({
        "event": "ALERT_CLAIMED",
        "alert_id": alert.id,
        "alert": {
            "id": alert.id,
            "status": alert.status,
            "claimed_by_type": alert.claimed_by_type,
            "responder_lat": alert.responder_lat,
            "responder_lon": alert.responder_lon,
            "user_confirmed_arrival": alert.user_confirmed_arrival
        }
    })
    
    return alert









@app.patch("/alerts/{alert_id}/confirm-arrival")
async def confirm_arrival(
    alert_id: str,
    db: Session = Depends(database.get_db)
):
    try:
        uuid_obj = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    # Find the alert
    alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == uuid_obj).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update confirmation
    alert.user_confirmed_arrival = True
    
    db.commit()
    db.refresh(alert)
    
    # Notify via WebSocket
    await manager.broadcast({
        "event": "USER_CONFIRMED_ARRIVAL",
        "alert_id": alert.id,
        "alert": {
            "id": alert.id,
            "status": alert.status,
            "user_confirmed_arrival": alert.user_confirmed_arrival
        }
    })
    
    return {"message": "Arrival confirmed", "alert": alert}





@app.get("/alerts") # This matches the URL your frontend is calling
async def get_alerts(db: Session = Depends(database.get_db)):
    alerts = db.query(models.EmergencyAlert).all()
    return alerts







# ✅ Get nearest police/amotekun station
@app.get("/police-posts/nearby")
def get_nearest_station(lat: float, lon: float, radius: float = 10000, db: Session = Depends(database.get_db)):
    # Find nearest station using PostGIS
    from sqlalchemy import func
    
    station = db.query(
        models.PolicePost,
        func.ST_Distance(
            models.PolicePost.location,
            func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        ).label('distance')
    ).filter(
        func.ST_DWithin(
            models.PolicePost.location,
            func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326),
            radius
        )
    ).order_by('distance').first()
    
    if station:
        return {
            "id": station[0].id,
            "name": station[0].name,
            "area_command": station[0].area_command,
            "phone_no": station[0].phone_no,
            "latitude": station[0].latitude,
            "longitude": station[0].longitude
        }
    return None

# # ✅ Update rescuer location
# @app.patch("/rescuers/location")
# def update_rescuer_location(
#     responder_type: str,
#     latitude: float,
#     longitude: float,
#     db: Session = Depends(database.get_db)
# ):
#     # Store in a RescuerLocation table or update alert's responder location
#     # For simplicity, update all active alerts for this responder
#     alerts = db.query(models.Alert).filter(
#         models.Alert.claimed_by_type == responder_type,
#         models.Alert.status == "HELP_ON_THE_WAY"
#     ).all()
    
#     for alert in alerts:
#         alert.responder_lat = latitude
#         alert.responder_lon = longitude
    
#     db.commit()
#     return {"status": "location updated"}


# main.py - Update the rescuer location endpoint
# @app.patch("/rescuers/location")
# def update_rescuer_location(
#     location_data: dict,  # Accept JSON body
#     db: Session = Depends(database.get_db),
#     current_user: models.User = Depends(get_current_user)  # Optional: add auth
# ):
#     try:
#         responder_type = location_data.get("responder_type")
#         latitude = location_data.get("latitude")
#         longitude = location_data.get("longitude")
        
#         if not responder_type or latitude is None or longitude is None:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="Missing required fields: responder_type, latitude, longitude"
#             )
        
#         # Update all active alerts for this responder type
#         alerts = db.query(models.Alert).filter(
#             models.Alert.responder_type == responder_type,
#             models.Alert.status.in_(["ASSIGNED", "HELP_ON_THE_WAY"])
#         ).all()
        
#         for alert in alerts:
#             alert.responder_lat = latitude
#             alert.responder_lon = longitude
        
#         db.commit()
        
#         return {
#             "status": "location updated",
#             "updated_alerts": len(alerts),
#             "position": {"lat": latitude, "lon": longitude}
#         }
        
#     except Exception as e:
#         print(f"Error updating location: {e}")
#         raise HTTPException(status_code=500, detail=str(e))




# main.py - Updated for EmergencyAlert model
@app.patch("/rescuers/location")
def update_rescuer_location(
    location_data: dict,
    db: Session = Depends(database.get_db)
):
    try:
        responder_type = location_data.get("responder_type")
        latitude = location_data.get("latitude")
        longitude = location_data.get("longitude")
        
        if not responder_type or latitude is None or longitude is None:
            raise HTTPException(
                status_code=400, 
                detail="Missing required fields: responder_type, latitude, longitude"
            )
        
        # ✅ Use the correct model name - CHANGE THIS to match your model
        from models import EmergencyAlert  # or whatever your model is called
        
        alerts = db.query(EmergencyAlert).filter(
            EmergencyAlert.claimed_by_type == responder_type,
            EmergencyAlert.status.in_(["ASSIGNED", "HELP_ON_THE_WAY"])
        ).all()
        
        for alert in alerts:
            alert.responder_lat = latitude
            alert.responder_lon = longitude
        
        db.commit()
        
        return {
            "status": "location updated",
            "updated_alerts": len(alerts)
        }
        
    except Exception as e:
        print(f"Error updating location: {e}")
        raise HTTPException(status_code=500, detail=str(e))







# ✅ Delete alert (only after resolved)
@app.delete("/alerts/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # ✅ Only allow deletion if resolved
    if alert.status != "RESOLVED":
        raise HTTPException(status_code=400, detail="Alert must be resolved before deletion")
    
    # ✅ Only the reporter can delete
    if alert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own alerts")
    
    db.delete(alert)
    db.commit()
    return {"status": "alert deleted"}






# from multiprocessing import get_context
# from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status

# # from sqlalchemy import Column
# # from sqlalchemy.dialects.postgresql import UUID
# # id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


# # from main_socket import manager # Ensure your ConnectionManager import is correct

# from sqlalchemy.orm import Session
# import models # Assuming you have an EmergencyAlert model

# from sqlalchemy import text, func
# from typing import List
# from fastapi.middleware.cors import CORSMiddleware  # Allows your React app (localhost:3000) to connect to this FastAPI backend
# from fastapi.security import OAuth2PasswordBearer
# from passlib.context import CryptContext
# from geoalchemy2.functions import ST_Distance, ST_GeogFromText
# import datetime

# #security authentication
# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from jose import jwt, JWTError
# SECRET_KEY = "YOUR_SUPER_SECRET_KEY" # Keep this private!
# ALGORITHM = "HS256"

# from fastapi import BackgroundTasks
# import uuid


# # Absolute imports from your local files
# import models
# import schemas
# import database

# app = FastAPI(title="Uncle Mayor SOS API")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")





# # 1. Initialize the context (Make sure this is an OBJECT, not a function)
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # 2. If you want a helper function, keep it separate
# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)






# # Allows your React app (localhost:3000) to connect to this FastAPI backend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Initialize database tables on startup
# models.Base.metadata.create_all(bind=database.engine)



# # Websocket for real time communication
# class ConnectionManager:
#     def __init__(self):
#         # Admin connections listening to ALL alerts
#         self.admin_connections: list[WebSocket] = []
#         # User connections listening to a specific alert ID
#         self.user_connections: dict[int, list[WebSocket]] = {}

#     async def connect_admin(self, websocket: WebSocket):
#         await websocket.accept()
#         self.admin_connections.append(websocket)

#     async def connect_user(self, websocket: WebSocket, alert_id: int):
#         await websocket.accept()
#         if alert_id not in self.user_connections:
#             self.user_connections[alert_id] = []
#         self.user_connections[alert_id].append(websocket)

#     def disconnect(self, websocket: WebSocket):
#         if websocket in self.admin_connections:
#             self.admin_connections.remove(websocket)
#         # Clean up user dict as well if needed
        
#     async def broadcast_to_admins(self, message: dict):
#         for connection in self.admin_connections:
#             await connection.send_json(message)

#     async def notify_user(self, alert_id: int, message: dict):
#         if alert_id in self.user_connections:
#             for connection in self.user_connections[alert_id]:
#                 await connection.send_json(message)

# manager = ConnectionManager()
































# @app.websocket("/ws/alerts")
# async def websocket_alerts(websocket: WebSocket):
#     await manager.connect_admin(websocket)
#     try:
#         while True:
#             await websocket.receive_text() # Keep connection alive
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)





# @app.websocket("/ws/status/{alert_id}")
# async def websocket_user_status(websocket: WebSocket, alert_id: int):
#     await manager.connect_user(websocket, alert_id)
#     try:
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)











# # --- ENDPOINTS ---
# @app.get("/")
# def root():
#     return {"message": "Uncle Mayor SOS System API is Live"}



# # Create UserOut in schemas if needed
# @app.post("/users/register")
# def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
#     # 1. Convert Pydantic model to a dictionary
#     user_data = user.model_dump()
    
#     # 1. Pop the password out safely
#     raw_password = user_data.pop("password") #, None
    
#     # 2. DEBUG: Print to terminal to see what's actually coming from React
#     print(f"DEBUG: Password type: {type(raw_password)}")
#     print(f"DEBUG: Password value: {raw_password}")

#     if not raw_password:
#         raise HTTPException(status_code=400, detail="Password is required and cannot be empty")

#     # 3. Explicitly cast to string and truncate just in case of weirdness
#     clean_password = str(raw_password)[:72]
    
#     # 4. Hash it
#     try:
#         hashed_pw = pwd_context.hash(clean_password)
#     except Exception as e:
#         print(f"Hashing failed: {e}")
#         raise HTTPException(status_code=500, detail="Internal encryption error")
    
#     # 5. Create user
#     new_user = models.User(**user_data, hashed_password=hashed_pw)
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     return new_user




# # 1. Trigger SOS Alert (Core Function)
# @app.post("/alerts/trigger", response_model=schemas.AlertResponse)
# async def trigger_sos(alert_data: schemas.AlertCreate, db: Session = Depends(database.get_db)):
#     # 1. Create the consolidated record using the merged table fields
#     new_alert = models.EmergencyAlert(
#         user_id=alert_data.user_id,
#         username=alert_data.username,
#         lat=alert_data.lat,
#         lon=alert_data.lon,
#         status="PENDING",
#         # Generate a readable incident number
#         incident_number=f"SOS-{uuid.uuid4().hex[:6].upper()}",
#         # Explicitly setting the time with the new UTC fix
#         created_at=datetime.now(datetime.timezone.utc)
#     )
    
#     db.add(new_alert)
#     db.commit()
#     db.refresh(new_alert)
    
#     # 2. Convert to dictionary for WebSocket 
#     # CRITICAL: id must be converted to str() because it is a UUID object
#     alert_dict = {
#         "id": str(new_alert.id), 
#         "username": new_alert.username,
#         "lat": new_alert.lat,
#         "lon": new_alert.lon,
#         "incident_number": new_alert.incident_number,
#         "status": new_alert.status,
#         "created_at": new_alert.created_at.isoformat()
#     }
    
#     # 3. Broadcast to all active dashboards (Police, Amotekun, Admin)
#     await manager.broadcast({"event": "NEW_SOS", "alert": alert_dict})
    
#     return new_alert





# # @app.post("/alerts/trigger", response_model=schemas.AlertResponse)
# # async def trigger_sos(alert_data: schemas.AlertCreate, db: Session = Depends(database.get_db)):
# #     # 1. Create the consolidated record
# #     new_alert = models.EmergencyAlert(
# #         user_id=alert_data.user_id,
# #         username=alert_data.username,
# #         lat=alert_data.lat,
# #         lon=alert_data.lon,
# #         status="PENDING",
# #         incident_number=f"SOS-{uuid.uuid4().hex[:6].upper()}"
# #     )
    
# #     db.add(new_alert)
# #     db.commit()
# #     db.refresh(new_alert)
    
# #     # 2. Convert to dictionary for WebSocket
# #     alert_dict = {
# #         "id": new_alert.id,
# #         "username": new_alert.username,
# #         "lat": new_alert.lat,
# #         "lon": new_alert.lon,
# #         "incident_number": new_alert.incident_number,
# #         "status": new_alert.status
# #     }
    
# #     # 3. Broadcast to Police & Amotekun
# #     await manager.broadcast({"event": "NEW_SOS", "alert": alert_dict})
    
# #     return new_alert




# # @app.post("/alerts/trigger", response_model=schemas.AlertResponse)
# # async def trigger_sos(req: schemas.SOSRequest, db: Session = Depends(database.get_db)):
# #     # Find nearest police post using PostGIS <-> (Distance Operator)
# #     # 4326 is the SRID for standard Lat/Lon (WGS84)
# #     find_nearest_query = text("""
# #         SELECT id, phone FROM police_posts 
# #         ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) 
# #         LIMIT 1
# #     """)
    
# #     result = db.execute(find_nearest_query, {"lon": req.lon, "lat": req.lat}).fetchone()
    
# #     nearest_post_id = result[0] if result else None
# #     police_phone = result[1] if result else "767" # Fallback to Lagos Emergency

# #     # Create new alert in database
# #     new_alert = models.Alert(
# #         user_id=req.user_id,
# #         post_id=nearest_post_id,
# #         lat=req.lat,
# #         lon=req.lon,
# #         status="PENDING"
# #     )
    
# #     db.add(new_alert)
# #     db.commit()
# #     db.refresh(new_alert)
    
# #     return {
# #         "id": new_alert.id,
# #         "status": new_alert.status,
# #         "police_phone": police_phone,
# #         "created_at": new_alert.created_at
# #     }
    
    
    
    
    
    
    
    
    

# # 2. Get User Alert History (Victim Dashboard)
# @app.get("/alerts/history/{user_id}", response_model=List[schemas.AlertHistory])
# def get_user_history(user_id: int, db: Session = Depends(database.get_db)):
#     history = db.query(models.Alert).filter(models.Alert.user_id == user_id).order_by(models.Alert.created_at.desc()).all()
#     return history





# # 3. Get All Active Alerts (Super Admin Dashboard)
# # @app.get("/admin/alerts/active")
# # def get_active_alerts(db: Session = Depends(get_db)):
# #     # Fetch alerts where status is PENDING or DISPATCHED
# #     active_alerts = db.query(models.Alert).filter(
# #         models.Alert.status.in_(["PENDING", "DISPATCHED"])
# #     ).order_by(models.Alert.created_at.desc()).all()
    
# #     return active_alerts



# @app.get("/admin/alerts/active")
# def get_all_active_alerts(db: Session = Depends(database.get_db)):
#     # Joining alerts with users and police_posts for a complete view
#     active_alerts = db.execute(text("""
#         SELECT a.id, u.phone_no as victim_phone, p.name as assigned_post, a.status, a.lat, a.lon, a.created_at
#         FROM alerts a
#         LEFT JOIN users u ON a.user_id = u.id
#         LEFT JOIN police_posts p ON a.post_id = p.id
#         WHERE a.status != 'RESOLVED'
#         ORDER BY a.created_at DESC
#     """)).mappings().all()
#     return list(active_alerts)



# # @app.get("/admin/alerts/active")
# # def get_active_alerts(db: Session = Depends(database.get_db)):
# #     active_alerts = db.query(models.Alert).filter(
# #         models.Alert.status != 'RESOLVED'
# #     ).order_by(models.Alert.created_at.desc()).all()
    
# #     # This will return the alert objects. 
# #     # Because of the relationships we set up, you can access user data 
# #     # in your frontend using alert.user.phone_no
# #     return active_alerts




# # 4. Update Alert Status (Police/Admin Action)
# # @app.patch("/alerts/{alert_id}/status")
# # def update_alert_status(alert_id: int, new_status: str, db: Session = Depends(database.get_db)):
# #     alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
# #     if not alert:
# #         raise HTTPException(status_code=404, detail="Alert not found")
    
# #     alert.status = new_status
# #     db.commit()
# #     return {"message": f"Alert {alert_id} updated to {new_status}"}




# @app.patch("/admin/alerts/{alert_id}/status")
# def update_alert_status(alert_id: int, status_update: dict, db: Session = Depends(database.get_db)):
#     alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
#     if not alert:
#         raise HTTPException(status_code=404, detail="Alert not found")
    
#     # status_update should be something like {"status": "RESOLVED"}
#     alert.status = status_update.get("status")
#     db.commit()
#     return {"message": f"Alert status updated to {alert.status}"}



# # 5. Archive Alert (Move to History) for Police/Admin - This is a "soft delete" that just hides it from the active dashboard but keeps it in the DB for audit logs
# @app.patch("/alerts/{alert_id}/archive")
# async def archive_alert(alert_id: int, responder_type: str, db: Session = Depends(database.get_db)):
#     alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
#     if not alert:
#         raise HTTPException(status_code=404, detail="Alert not found")    
#     # We don't delete from DB, we just mark it as resolved/hidden for this responder
#     alert.status = "ARCHIVED" 
#     db.commit()
    
#     return {"status": "success", "message": "Incident moved to history"}







# # 5. Get System Metrics (Super Admin Stats)
# @app.get("/admin/stats")
# def get_system_stats(db: Session = Depends(database.get_db)):
#     total_alerts = db.query(models.Alert).count()
#     pending_alerts = db.query(models.Alert).filter(models.Alert.status == 'PENDING').count()
#     total_posts = db.query(models.PolicePost).count()
    
#     return {
#         "total_alerts": total_alerts,
#         "pending": pending_alerts,
#         "total_police_posts": total_posts
#     }







# @app.post("/users/login")
# async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
#     user = db.query(models.User).filter(models.User.username == form_data.username).first()
#     # Make sure you use the name of the variable you defined at the top of your file
#     if not user or not pwd_context.verify(form_data.password, user.hashed_password):
#         raise HTTPException(status_code=400, detail="Incorrect username or password")
    
#     # Create a token
#     access_token = jwt.encode({"sub": user.username, "id": user.id}, SECRET_KEY, algorithm=ALGORITHM)
#     return {"access_token": access_token, "token_type": "bearer"}


# @app.get("/users/me", response_model=schemas.UserOut)
# def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise HTTPException(status_code=401, detail="Invalid token")
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Could not validate credentials")
        
#     user = db.query(models.User).filter(models.User.username == username).first()
#     return user



# @app.delete("/users/history/{alert_id}")
# def hide_alert_from_user(alert_id: int, db: Session = Depends(database.get_db)):
#     alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
#     alert.is_deleted_by_user = True # Soft delete
#     db.commit()
#     return {"message": "Alert removed from your history"}





# @app.post("/admin/police")
# def add_police_station(name: str, phone: str, lat: float, lon: float, db: Session = Depends(database.get_db)):
#     # Create the PostGIS POINT string
#     point = f"POINT({lon} {lat})"
#     new_post = models.PolicePost(
#         name=name, 
#         phone=phone, 
#         location=point
#     )
#     db.add(new_post)
#     db.commit()
#     return {"message": f"Station {name} added successfully"}










# @app.get("/alerts/nearest")
# def get_nearest_station(lat: float, lon: float, db: Session = Depends(database.get_db)):
#     user_location = f"POINT({lon} {lat})"
    
#     # Query using PostGIS ST_Distance for accurate earth-surface calculation
#     nearest = db.query(models.PolicePost).order_by(
#         ST_Distance(models.PolicePost.location, ST_GeogFromText(user_location))
#     ).first()

#     if not nearest:
#         raise HTTPException(status_code=404, detail="No stations found")
        
#     return {
#         "station_name": nearest.name,
#         "phone": nearest.phone
#     }
    
    
    
    
    
    
    
    
    
    
    
    

# # --- Helper: The Background "Worker" ---
# def notify_emergency_contacts(user_id: int, lat: float, lon: float, db: Session):
#     # 1. Get contacts
#     contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user_id).all()
    
#     # 2. Simulate sending notifications
#     for contact in contacts:
#         print(f"SENDING SMS TO {contact.phone_no}: EMERGENCY! User is at {lat}, {lon}")
#         # In production, use: requests.post("https://api.termii.com/api/sms/send", data=...)

# # --- Endpoints ---

# @app.post("/contacts")
# def add_contact(name: str, phone: str, email: str = None, 
#                 current_user: models.User = Depends(get_current_user), 
#                 db: Session = Depends(database.get_db)):
#     new_contact = models.EmergencyContact(
#         user_id=current_user.id, name=name, phone_no=phone, email=email
#     )
#     db.add(new_contact)
#     db.commit()
#     return {"message": "Contact added successfully"}

# @app.get("/contacts")
# def list_contacts(current_user: models.User = Depends(get_current_user), 
#                   db: Session = Depends(database.get_db)):
#     return db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == current_user.id).all()

# # --- MODIFIED SOS TRIGGER WITH BACKGROUND TASK ---
# @app.post("/alerts/trigger")
# async def trigger_sos(alert_data: dict, 
#                       background_tasks: BackgroundTasks, 
#                       db: Session = Depends(database.get_db)):
    
#     # Find nearest police post using PostGIS distance operator
#     find_nearest_query = text("""
#         SELECT id, name FROM police_posts 
#         ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) 
#         LIMIT 1
#     """)
    
#     result = db.execute(find_nearest_query, {"lon": alert_data['lon'], "lat": alert_data['lat']}).fetchone()
    
#     if not result:
#         raise HTTPException(status_code=404, detail="No police posts found")
    
#     nearest_post_id = result[0]
#     nearest_post_name = result[1]
    
#     # Save the alert to DB
#     new_alert = models.Alert(user_id=alert_data['user_id'], post_id=nearest_post_id, 
#                              lat=alert_data['lat'], lon=alert_data['lon'])
#     db.add(new_alert)
#     db.commit()

#     # ADD BACKGROUND TASK: This runs AFTER the response is sent to the user
#     background_tasks.add_task(notify_emergency_contacts, alert_data['user_id'], 
#                               alert_data['lat'], alert_data['lon'], db)

#     return {"status": "SOS Sent", "nearest_station": nearest_post_name}






# # @app.patch("/alerts/{alert_id}/attend")
# # async def attend_to_alert(alert_id: int, responder_type: str, db: Session = Depends(database.get_db)):
# #     db_alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    
# #     if db_alert.status != "PENDING":
# #         raise HTTPException(status_code=400, detail="Alert already claimed")

# #     db_alert.status = "ATTENDING" # This is "Help on the Way"
# #     db_alert.claimed_by_type = responder_type
# #     db_alert.responded_at = datetime.utcnow()
# #     db.commit()

# #     # BROADCAST: Notify everyone
# #     # 1. Notify User: "Help is on the way"
# #     # 2. Notify other Responders: "Remove this from your pending list"
# #     await manager.broadcast({
# #         "event": "ALERT_CLAIMED",
# #         "alert_id": alert_id,
# #         "claimed_by": responder_type,
# #         "status": "ATTENDING"
# #     })
# #     return db_alert

# @app.patch("/alerts/{alert_id}/respond")
# async def agency_respond(alert_id: int, responder_type: str, db: Session = Depends(database.get_db)):
#     alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    
#     if alert.status != "PENDING":
#         raise HTTPException(status_code=400, detail="Incident already being handled.")

#     alert.status = "HELP_ON_THE_WAY"
#     alert.claimed_by_type = responder_type
#     alert.responded_at = datetime.utcnow()
#     db.commit()

#     # WebSocket: Notify everyone
#     # 1. Notify other agency to REMOVE from dashboard
#     # 2. Notify user that help is coming
#     await manager.broadcast({
#         "event": "ALERT_CLAIMED",
#         "alert_id": alert_id,
#         "claimed_by": responder_type,
#         "status": "HELP_ON_THE_WAY"
#     })
#     return alert



# @app.patch("/alerts/{alert_id}/resolve")
# async def user_resolve_alert(alert_id: int, db: Session = Depends(database.get_db)):
#     db_alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    
#     db_alert.status = "RESOLVED"
#     db_alert.resolved_at = datetime.utcnow()
#     db.commit()

#     # Final Broadcast for Admin Audit logs
#     await manager.broadcast({
#         "event": "INCIDENT_RESOLVED",
#         "alert_id": alert_id,
#         "incident_number": db_alert.incident_number,
#         "resolved_by": db_alert.claimed_by_type,
#         "time": db_alert.resolved_at.isoformat()
#     })
#     return {"message": "Incident successfully resolved."}



# # --- System Health Check ---
# @app.get("/health")
# def health_check(db: Session = Depends(database.get_db)):
#     try:
#         db.execute(text("SELECT 1")) # Check if DB is alive
#         return {"status": "healthy", "database": "connected"}
#     except Exception as e:
#         raise HTTPException(status_code=503, detail="Database connection failed")
    
    
    
    
    
# # Send alert status updates to the user in real-time using WebSockets
# # Store active connections: {user_id: websocket_connection}
# class StatusConnectionManager:
#     def __init__(self):
#         self.active_connections: dict[int, WebSocket] = {}

#     async def connect(self, user_id: int, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections[user_id] = websocket

#     def disconnect(self, user_id: int):
#         if user_id in self.active_connections:
#             del self.active_connections[user_id]

#     async def send_status_update(self, user_id: int, message: dict):
#         if user_id in self.active_connections:
#             await self.active_connections[user_id].send_json(message)

# status_manager = StatusConnectionManager()

# @app.websocket("/ws/status/{user_id}")
# async def status_websocket_endpoint(websocket: WebSocket, user_id: int):
#     await status_manager.connect(user_id, websocket)
#     try:
#         while True:
#             await websocket.receive_text() # Keep connection alive
#     except WebSocketDisconnect:
#         status_manager.disconnect(user_id)
    
    
    
    


# def update_status_in_db(db: Session, alert_id: int, new_status: str):
#     # 1. Find the alert by its ID
#     db_alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    
#     if db_alert:
#         # 2. Update the status
#         db_alert.status = new_status
#         db.commit()
#         db.refresh(db_alert)
#         return db_alert
#     return None
    
    
# @app.patch("/admin/alerts/{alert_id}")
# async def update_alert_status(alert_id: int, payload: dict, db: Session = Depends(database.get_db)):
#     print(f"DEBUG: Updating alert {alert_id} to status: {payload.get('status')}")
#     # 1. Update DB status
#     # Pass 'db' as the first argument
#     db_alert = update_status_in_db(db, alert_id, payload['status'])
    
    
#     # # 2. If status is DISupdate_status_in_dbPATCHED, notify the citizen!
#     # if payload['status'] == "DISPATCHED":
#     #     await status_manager.send_status_update(
#     #         db_alert.user_id, 
#     #         {"status": "DISPATCHED", "eta": "10 mins"}
#     #     )
    
#     # return {"message": "Status updated"}
#     # NEW: Tell the user the status changed!
#     await manager.notify_user(alert_id, {
#         "event": "STATUS_UPDATED",
#         "alert_id": alert_id,
#         "new_status": payload['status']
#     })
    
#     return db_alert






# @app.get("/admin/users")
# def get_all_users(db: Session = Depends(database.get_db)):
#     return db.query(models.User).all()





# @app.get("/admin/stats")
# def get_admin_stats(db: Session = Depends(database.get_db)):
#     # Count total users and total alerts efficiently
#     total_users = db.query(models.User).count()
#     total_alerts = db.query(models.EmergencyAlert).count()
    
#     return {
#         "totalUsers": total_users,
#         "totalAlerts": total_alerts
#     }
    
    
    

# @app.get("/admin/audit-logs")
# def get_audit_logs(db: Session = Depends(database.get_db)):
#     # Returns only resolved alerts with responder details
#     return db.query(models.EmergencyAlert).filter(models.EmergencyAlert.status == "RESOLVED").all()