"""
MongoDB database connection and management.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from typing import Optional
import os

from src.core.config import settings


class MongoDB:
    """MongoDB connection manager for async operations."""
    client: Optional[AsyncIOMotorClient] = None
    database = None
    
    @classmethod
    async def connect(cls, mongodb_uri: Optional[str] = None, db_name: Optional[str] = None):
        """Connect to MongoDB Atlas."""
        uri = mongodb_uri or settings.mongodb_uri or os.getenv("MONGODB_URI")
        name = db_name or settings.mongodb_db_name
        
        cls.client = AsyncIOMotorClient(uri, server_api=ServerApi('1'))
        cls.database = cls.client[name]
        
        # Create indexes for employees collection
        await cls._create_employee_indexes()
        print(f"Connected to MongoDB: {name}")
    
    @classmethod
    async def _create_employee_indexes(cls):
        """Create indexes for employee collection for efficient queries."""
        employees_collection = cls.database.employees
        
        await employees_collection.create_index("email", unique=True)
        await employees_collection.create_index("department")
        await employees_collection.create_index("expertise_areas")
        await employees_collection.create_index("codebase_modules")
        
        print("Employee collection indexes created")
    
    @classmethod
    async def disconnect(cls):
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            print("Disconnected from MongoDB")


class SyncMongoDB:
    """Synchronous MongoDB client for Knowledge Agent."""
    
    def __init__(self, mongodb_uri: Optional[str] = None, db_name: Optional[str] = None):
        uri = mongodb_uri or settings.mongodb_uri or os.getenv("MONGODB_URI")
        name = db_name or settings.mongodb_db_name
        
        self.client = MongoClient(uri)
        self.database = self.client[name]
    
    def close(self):
        self.client.close()


# Global async database instance
db = MongoDB()

