import os
from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

class Storage:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.qdrant_client = None

    async def connect(self):
        # MongoDB Connection
        if not MONGO_URI:
            print("WARNING: MONGO_URI not found in environment")
        else:
            self.mongo_client = AsyncIOMotorClient(MONGO_URI)
            self.db = self.mongo_client.get_database()
            print("Successfully connected to MongoDB")

        # Qdrant Connection
        if not QDRANT_URL:
            print("WARNING: QDRANT_URL not found in environment")
        else:
            self.qdrant_client = QdrantClient(
                url=QDRANT_URL, 
                api_key=QDRANT_API_KEY
            )
            print("Successfully connected to Qdrant")

    async def disconnect(self):
        if self.mongo_client:
            self.mongo_client.close()
            print("Disconnected from MongoDB")

    def get_db(self):
        return self.db

    def get_qdrant(self):
        return self.qdrant_client

    async def health_check(self):
        health = {"mongodb": "offline", "qdrant": "offline"}
        try:
            if self.mongo_client:
                await self.mongo_client.admin.command('ping')
                health["mongodb"] = "online"
        except Exception as e:
            health["mongodb"] = f"error: {str(e)}"

        try:
            if self.qdrant_client:
                # Simple check for qdrant
                self.qdrant_client.get_collections()
                health["qdrant"] = "online"
        except Exception as e:
            health["qdrant"] = f"error: {str(e)}"
        
        return health

storage = Storage()
