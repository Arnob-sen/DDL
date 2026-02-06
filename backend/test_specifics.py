import asyncio
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

async def test_accessible_models():
    # 1. Test Embedding
    print("\n--- Testing Model: models/gemini-embedding-001 ---")
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        res = embeddings.embed_query("test")
        print(f"Success! Vector length: {len(res)}")
    except Exception as e:
        print(f"Failed: {e}")

    # 2. Test LLM
    print("\n--- Testing Model: models/gemini-3-flash-preview ---")
    try:
        llm = ChatGoogleGenerativeAI(model="models/gemini-3-flash-preview")
        res = llm.invoke("Say hello")
        print(f"Success! Response: {res.content}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_accessible_models())
