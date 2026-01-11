"""
MongoDB database connection and schema setup.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from typing import Optional
import os

# Try to import certifi for SSL certificate verification
try:
    import certifi
    CA_BUNDLE = certifi.where()
except ImportError:
    CA_BUNDLE = None


class MongoDB:
    """MongoDB connection manager."""
    client: Optional[AsyncIOMotorClient] = None
    database = None
    
    @classmethod
    async def connect(cls, mongodb_uri: str, db_name: str = "security_qa"):
        """Connect to MongoDB Atlas."""
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
            
            # Access database
            cls.database = cls.client[db_name]
            
            # Create indexes
            await cls._create_indexes()
            print(f"✅ Connected to MongoDB: {db_name}")
        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {e}")
            raise
    
    @classmethod
    async def _create_indexes(cls):
        """Create indexes for collections."""
        # Employee indexes
        employees_collection = cls.database.employees
        await employees_collection.create_index("email", unique=True)
        await employees_collection.create_index("department")
        await employees_collection.create_index("expertise_areas")
        await employees_collection.create_index("codebase_modules")
        
        print("Database indexes created")
    
    @classmethod
    async def disconnect(cls):
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            print("Disconnected from MongoDB")


# Global database instance
db = MongoDB()
