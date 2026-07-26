from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID

# --- USER SCHEMAS ---

class UserCreate(BaseModel):
    firstname: str
    lastname: str
    username: str
    email: EmailStr
    phone_no: str
    address: str
    state: str = "Lagos"
    country: str = "Nigeria"
    password: str
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    username: str
    email: str
    phone_no: str

    class Config:
        from_attributes = True

# --- SOS & ALERT SCHEMAS ---

# This is what the Frontend sends when someone hits the SOS button
class AlertCreate(BaseModel):
    user_id: int
    username: str
    lat: float  
    lon: float

# Base Alert fields shared across responses
class AlertBase(BaseModel):
    user_id: int
    username: str
    lat: float
    lon: float
    status: str
    incident_number: str

# This is what the Backend sends back to the Dashboards/User
class AlertResponse(AlertBase):
    id: UUID  # CRITICAL: Changed from int to UUID to match models.py
    created_at: datetime
    claimed_by_type: Optional[str] = None
    responder_name: Optional[str] = None
    responded_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# For the Admin History/Audit log
class AlertHistory(BaseModel):
    id: UUID
    incident_number: str
    username: str
    status: str
    claimed_by_type: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True




class ResponderUpdate(BaseModel):
    responder_type: str = Field(..., description="Type of responder (POLICE, AMOTEKUN)")
    responder_lat: float = Field(..., ge=-90, le=90, description="Latitude of responder")
    responder_lon: float = Field(..., ge=-180, le=180, description="Longitude of responder")
    
    
    class Config:
        json_schema_extra = {
            "example": {
                "responder_type": "POLICE",
                "responder_lat": 6.449535,
                "responder_lon": 3.449049
            }
        }
# class ResponderUpdate(BaseModel):
#     responder_type: str  # 'POLICE' or 'AMOTEKUN'
#     responder_lat: float
#     responder_lon: float

#     # class Config:
#     #     from_attributes = True




class PolicePostBase(BaseModel):
    name: str
    area_command: str  # ✅ Add this field
    phone_no: str
    latitude: float
    longitude: float

class PolicePostCreate(PolicePostBase):
    pass

class PolicePost(PolicePostBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True






# from pydantic import BaseModel
# from datetime import datetime
# from typing import Optional, List
# from pydantic.networks import EmailStr


# # from pydantic import BaseModel, EmailStr

# # Schema for User Creation
# class UserCreate(BaseModel):
#     firstname: str
#     lastname: str
#     username: str
#     email: EmailStr
#     phone_no: str
#     address: str
#     state: str = "Lagos"
#     country: str = "Nigeria"
#     password: str
#     # Use Optional if the user doesn't HAVE to provide these
#     blood_group: Optional[str] = None
#     emergency_contact_name: Optional[str] = None
#     emergency_contact_phone: Optional[str] = None
    
#     class Config:
#         from_attributes = True
        
        
        
        
# # Schema for User Login
# class UserLogin(BaseModel):
#     username: str
#     password: str


# # Schema for User Output/Response
# class UserOut(BaseModel):
#     id: int
#     firstname: str
#     lastname: str
#     username: str
#     email: str
#     phone_no: str
    
#     class Config:
#         from_attributes = True



# # Schema for creating an SOS
# class SOSRequest(BaseModel):
#     user_id: int
#     lat: float
#     lon: float

# # Schema for the API Response
# class AlertResponse(BaseModel):
#     id: int
#     status: str
#     police_phone: Optional[str] = None
#     created_at: datetime

#     class Config:
#         from_attributes = True

# # Schema for History
# class AlertHistory(BaseModel):
#     id: int
#     lat: float
#     lon: float
#     status: str
#     created_at: datetime

#     class Config:
#         from_attributes = True
        
        

# # class AlertCreate(BaseModel):
# #     title: str
# #     description: str
# #     # add other fields here

        
# # class AlertBase(BaseModel): 
# #     title: str 
# #     description: str


# # class Alert(AlertBase): 
# #     id: int 
# #     class Config: 
# #         # orm_mode = True
# #         from_attributes = True
        


# class AlertBase(BaseModel):
#     user_id: int
#     username: str
#     lat: float  # Make sure these match the DB column names exactly
#     lon: float
#     status: str = "PENDING"


# # Change this to match your new merged table columns
# class AlertCreate(BaseModel):
#     user_id: int
#     username: str
#     lat: float  # Must match what Frontend sends
#     lon: float  # Must match what Frontend sends


# class AlertResponse(AlertBase):
#     id: int
#     incident_number: str
#     created_at: datetime
#     claimed_by_type: Optional[str] = None

#     class Config:
#         from_attributes = True