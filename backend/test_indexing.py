import asyncio
import os
from dotenv import load_dotenv

# Set up paths
os.environ["PYTHONPATH"] = os.getcwd()
load_dotenv()

from src.indexing.pipeline import indexing_pipeline
from src.storage.db import storage

async def test_indexing():
    await storage.connect()
    file_path = "/media/arnob/New Volume/Dev/DDL/data/20260110_MiniMax_Industry_Report.pdf"
    doc_name = "Industry Report"
    
    print(f"Testing indexing for: {file_path}")
    try:
        chunks_count = await indexing_pipeline.index_document(file_path, doc_name)
        print(f"Successfully indexed {chunks_count} chunks.")
    except Exception as e:
        print(f"Indexing FAILED: {str(e)}")
    finally:
        await storage.disconnect()

if __name__ == "__main__":
    asyncio.run(test_indexing())
