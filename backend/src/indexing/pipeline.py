import os
import uuid
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import Qdrant
from qdrant_client import QdrantClient

from ..storage.db import storage

class IndexingPipeline:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            add_start_index=True
        )

    async def index_document(self, file_path: str, doc_name: str, collection_name: str = "ALL_DOCS"):
        # 1. Load PDF
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        # 2. Split into chunks
        chunks = self.text_splitter.split_documents(documents)

        # 3. Add metadata
        for chunk in chunks:
            chunk.metadata["document_name"] = doc_name
            chunk.metadata["source_path"] = file_path

        # 4. Store in Qdrant
        qdrant_client = storage.get_qdrant()
        if qdrant_client:
            # Note: In a real app we'd handle collection creation/existence
            # Using LangChain's Qdrant wrapper
            vector_db = Qdrant(
                client=qdrant_client,
                collection_name=collection_name,
                embeddings=self.embeddings
            )
            vector_db.add_documents(chunks)
            print(f"Indexed {len(chunks)} chunks from {doc_name} into {collection_name}")
            return len(chunks)
        else:
            raise Exception("Qdrant client not initialized")

indexing_pipeline = IndexingPipeline()
