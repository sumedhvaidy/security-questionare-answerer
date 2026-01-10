"""
Script to seed MongoDB with fake employee data for the startup
"""
import asyncio
from database import db
from motor.motor_asyncio import AsyncIOMotorCollection
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


# Fake employee data for the startup
FAKE_EMPLOYEES = [
    {
        "name": "Alice Chen",
        "email": "alice.chen@startup.com",
        "role": "Chief Security Officer",
        "department": "Security",
        "codebase_modules": ["auth", "encryption", "api-security", "rbac"],
        "expertise_areas": ["authentication", "authorization", "encryption", "data-protection", "compliance"]
    },
    {
        "name": "Bob Martinez",
        "email": "bob.martinez@startup.com",
        "role": "Senior Security Engineer",
        "department": "Security",
        "codebase_modules": ["auth", "oauth", "jwt"],
        "expertise_areas": ["authentication", "oauth", "jwt", "session-management"]
    },
    {
        "name": "Carol Johnson",
        "email": "carol.johnson@startup.com",
        "role": "Security Compliance Lead",
        "department": "Compliance",
        "codebase_modules": ["audit", "logging", "data-retention"],
        "expertise_areas": ["gdpr", "soc2", "compliance", "data-governance", "audit-trails"]
    },
    {
        "name": "David Kim",
        "email": "david.kim@startup.com",
        "role": "Senior Backend Engineer",
        "department": "Engineering",
        "codebase_modules": ["api-security", "rate-limiting", "input-validation"],
        "expertise_areas": ["api-security", "rate-limiting", "input-validation", "infrastructure"]
    },
    {
        "name": "Emma Wilson",
        "email": "emma.wilson@startup.com",
        "role": "Security Engineer",
        "department": "Security",
        "codebase_modules": ["encryption", "key-management", "secrets"],
        "expertise_areas": ["encryption", "key-management", "secrets-management", "data-protection"]
    },
    {
        "name": "Frank Liu",
        "email": "frank.liu@startup.com",
        "role": "DevOps Engineer",
        "department": "Engineering",
        "codebase_modules": ["infrastructure", "deployment", "monitoring"],
        "expertise_areas": ["infrastructure", "network-security", "devops", "monitoring"]
    },
    {
        "name": "Grace Park",
        "email": "grace.park@startup.com",
        "role": "Data Engineer",
        "department": "Engineering",
        "codebase_modules": ["database", "data-pipeline", "etl"],
        "expertise_areas": ["database-security", "data-protection", "data-governance"]
    },
    {
        "name": "Henry Brown",
        "email": "henry.brown@startup.com",
        "role": "Compliance Analyst",
        "department": "Compliance",
        "codebase_modules": ["compliance-checks", "reporting"],
        "expertise_areas": ["soc2", "gdpr", "compliance", "documentation"]
    }
]


async def seed_employees(mongodb_uri: str, db_name: str = "Employees"):
    """Seed the employees collection with fake employee data"""
    await db.connect(mongodb_uri, db_name)
    
    employees_collection: AsyncIOMotorCollection = db.database.employees
    
    # Check if collection exists (it will be created automatically on first insert if not)
    try:
        collection_list = await db.database.list_collection_names()
        if "employees" not in collection_list:
            print(f"Collection 'employees' does not exist. It will be created on first insert.")
        else:
            print(f"Collection 'employees' already exists.")
    except Exception as e:
        print(f"Note: Could not check collections (may be empty DB): {e}")
    
    # Clear existing employees (optional - remove if you want to keep existing data)
    # await employees_collection.delete_many({})
    
    inserted_count = 0
    for employee_data in FAKE_EMPLOYEES:
        # Check if employee already exists by email
        existing = await employees_collection.find_one({"email": employee_data["email"]})
        
        if not existing:
            employee_data["created_at"] = datetime.now(timezone.utc)
            result = await employees_collection.insert_one(employee_data)
            inserted_count += 1
            print(f"Inserted employee: {employee_data['name']} ({employee_data['email']})")
        else:
            print(f"Employee already exists: {employee_data['email']}")
    
    print(f"\nTotal employees seeded: {inserted_count}/{len(FAKE_EMPLOYEES)}")
    
    # Verify counts
    total_count = await employees_collection.count_documents({})
    print(f"Total employees in database: {total_count}")
    
    await db.disconnect()


if __name__ == "__main__":
    # Get MongoDB URI from environment variable
    mongodb_uri = os.getenv("MONGODB_URI")
    
    if not mongodb_uri:
        print("Error: MONGODB_URI environment variable not set")
        print("Please set MONGODB_URI in your .env file or environment")
        import sys
        sys.exit(1)
    
    # Use "Employees" as the database name
    db_name = "Employees"
    
    print(f"Using MongoDB URI: {mongodb_uri[:50]}...")
    print(f"Using database name: {db_name}\n")
    
    asyncio.run(seed_employees(mongodb_uri, db_name))
