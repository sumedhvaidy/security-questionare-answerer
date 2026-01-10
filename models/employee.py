from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return ObjectId(v)
            raise ValueError("Invalid ObjectId string")
        raise ValueError("Invalid ObjectId")


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
        populate_by_name = True  # Pydantic v2 syntax (was allow_population_by_field_name)
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {  # Pydantic v2 syntax (was schema_extra)
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
