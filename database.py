"""
MongoDB database connection and schema setup for employees
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from typing import Optional
import os
try:
    import certifi
    CA_BUNDLE = certifi.where()
except ImportError:
    CA_BUNDLE = None


class MongoDB:
    """MongoDB connection manager"""
    client: Optional[AsyncIOMotorClient] = None
    database = None
    
    @classmethod
    async def connect(cls, mongodb_uri: str, db_name: str = "security_qa"):
        """Connect to MongoDB Atlas"""
        try:
            # Configure client with SSL certificate bundle if available
            client_kwargs = {
                "server_api": ServerApi('1')
            }
            
            # Use certifi if available for SSL certificate verification
            if CA_BUNDLE:
                client_kwargs["tlsCAFile"] = CA_BUNDLE
            
            cls.client = AsyncIOMotorClient(mongodb_uri, **client_kwargs)
            
            # Test connection
            await cls.client.admin.command('ping')
            
            # Access database (will be created automatically if it doesn't exist)
            cls.database = cls.client[db_name]
            
            # Create indexes for employees collection
            await cls._create_employee_indexes()
            print(f"✅ Connected to MongoDB: {db_name}")
        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {e}")
            raise
    
    @classmethod
    async def _create_employee_indexes(cls):
        """Create indexes for employee collection for efficient queries"""
        employees_collection = cls.database.employees
        
        # Index on email for unique lookups
        await employees_collection.create_index("email", unique=True)
        
        # Index on department for filtering
        await employees_collection.create_index("department")
        
        # Index on expertise_areas for text search
        await employees_collection.create_index("expertise_areas")
        
        # Index on codebase_modules for filtering
        await employees_collection.create_index("codebase_modules")
        
        print("Employee collection indexes created")
    
    @classmethod
    async def disconnect(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("Disconnected from MongoDB")


# Global database instance
db = MongoDB()
