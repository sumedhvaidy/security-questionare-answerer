from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class Employee(BaseModel):
    id: Optional[PyObjectId] = None
    name: str
    email: EmailStr
    role: str
    department: str
    codebase_modules: List[str] = []  # Parts of codebase they work on
    expertise_areas: List[str] = []  # Security domains they handle
    created_at: datetime = datetime.utcnow()
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@startup.com",
                "role": "Senior Security Engineer",
                "department": "Security",
                "codebase_modules": ["auth", "encryption", "api-security"],
                "expertise_areas": ["authentication", "encryption", "data-protection"]
            }
        }


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    role: str
    department: str
    codebase_modules: List[str] = []
    expertise_areas: List[str] = []


class EmployeeResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    codebase_modules: List[str]
    expertise_areas: List[str]
    created_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}
