import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_db():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(uri)
    db = client.get_database()
    
    docs = await db.documents.find({}).to_list(100)
    print("Documents in DB:")
    for doc in docs:
        print(f"- {doc.get('name')} | Status: {doc.get('status')} | Chunks: {doc.get('chunks_count')}")
    
    jobs = await db.jobs.find({}).sort("created_at", -1).to_list(10)
    print("\nRecent Jobs:")
    for job in jobs:
        print(f"- Type: {job.get('type')} | Status: {job.get('status')} | Message: {job.get('message')} | Error: {job.get('error')}")

if __name__ == "__main__":
    asyncio.run(check_db())
