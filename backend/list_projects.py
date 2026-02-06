import asyncio
from src.storage.db import storage

async def list_projs():
    await storage.connect()
    db = storage.get_db()
    if db is not None:
        projs = await db.projects.find({}, {"id": 1, "name": 1}).to_list(100)
        print("--- Projects in Database ---")
        for p in projs:
            print(f"Name: {p.get('name')}, ID: {p.get('id')}")
        print("---------------------------")
    await storage.disconnect()

if __name__ == "__main__":
    asyncio.run(list_projs())
