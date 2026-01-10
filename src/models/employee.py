"""
Employee models for escalation routing.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime


class Employee(BaseModel):
    """Employee who can handle escalated questions."""
    id: Optional[str] = None
    name: str
    email: EmailStr
    role: str
    department: str
    codebase_modules: List[str] = Field(default_factory=list, description="Parts of codebase they work on")
    expertise_areas: List[str] = Field(default_factory=list, description="Security domains they handle")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class EmployeeCreate(BaseModel):
    """Schema for creating an employee."""
    name: str
    email: EmailStr
    role: str
    department: str
    codebase_modules: List[str] = Field(default_factory=list)
    expertise_areas: List[str] = Field(default_factory=list)


class EmployeeResponse(BaseModel):
    """Employee response for API."""
    id: str
    name: str
    email: str
    role: str
    department: str
    codebase_modules: List[str]
    expertise_areas: List[str]
    created_at: datetime

