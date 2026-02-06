import os
import uuid
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models

from ..storage.db import storage

class IndexingPipeline:
    def __init__(self):
        # This specific preview key requires the 'models/' prefix and has 3072 dimensions
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
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

        # 4. Store in Qdrant in batches
        qdrant_client = storage.get_qdrant()
        if qdrant_client:
            # Ensure collection exists with correct dimensions (3072 for this preview model)
            target_dim = 3072 
            try:
                info = qdrant_client.get_collection(collection_name)
                current_dim = info.config.params.vectors.size
                if current_dim != target_dim:
                    print(f"Dimension mismatch ({current_dim} vs {target_dim}). Recreating collection...")
                    qdrant_client.delete_collection(collection_name)
            except Exception:
                pass # Collection doesn't exist

            if not qdrant_client.collection_exists(collection_name):
                qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(size=target_dim, distance=models.Distance.COSINE),
                )

            vector_db = QdrantVectorStore(
                client=qdrant_client,
                collection_name=collection_name,
                embedding=self.embeddings
            )
            
            # Process in batches to avoid timeouts
            batch_size = 20
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]
                print(f"Indexing batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1} for {doc_name}...")
                vector_db.add_documents(batch)
            
            print(f"Indexed {len(chunks)} chunks from {doc_name} into {collection_name}")
            return len(chunks)
        else:
            raise Exception("Qdrant client not initialized")

indexing_pipeline = IndexingPipeline()
