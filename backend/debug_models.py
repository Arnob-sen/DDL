import asyncio
import os
from src.storage.db import storage
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

async def debug_models():
    models_to_test = [
        "text-embedding-004",
        "embedding-001",
        "models/text-embedding-004",
        "models/embedding-001"
    ]
    
    for model in models_to_test:
        print(f"\n--- Testing Model: {model} ---")
        try:
            embeddings = GoogleGenerativeAIEmbeddings(model=model)
            res = embeddings.embed_query("test")
            print(f"Success! Vector length: {len(res)}")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_models())
