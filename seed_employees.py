"""
Script to seed MongoDB with fake employee data for the startup
"""
import asyncio
from database import db
from models.employee import EmployeeCreate
from motor.motor_asyncio import AsyncIOMotorCollection
import os
from datetime import datetime


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


async def seed_employees(mongodb_uri: str, db_name: str = "security_qa"):
    """Seed the employees collection with fake employee data"""
    await db.connect(mongodb_uri, db_name)
    
    employees_collection: AsyncIOMotorCollection = db.database.employees
    
    # Clear existing employees (optional - remove if you want to keep existing data)
    # await employees_collection.delete_many({})
    
    inserted_count = 0
    for employee_data in FAKE_EMPLOYEES:
        # Check if employee already exists by email
        existing = await employees_collection.find_one({"email": employee_data["email"]})
        
        if not existing:
            employee_data["created_at"] = datetime.utcnow()
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
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python seed_employees.py <MONGODB_URI> [DB_NAME]")
        print("Example: python seed_employees.py 'mongodb+srv://user:pass@cluster.mongodb.net/' security_qa")
        sys.exit(1)
    
    mongodb_uri = sys.argv[1]
    db_name = sys.argv[2] if len(sys.argv) > 2 else "security_qa"
    
    asyncio.run(seed_employees(mongodb_uri, db_name))
