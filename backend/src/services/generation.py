import os
from typing import List, Tuple
import asyncio
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient

from ..storage.db import storage
from ..models.models import Answer, Citation, AnswerStatus

class GenerationService:
    def __init__(self):
        # This preview key requires models/gemini-embedding-001 (3072 dim) and models/gemini-3-flash-preview
        self.llm = ChatGoogleGenerativeAI(model="models/gemini-3-flash-preview")
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        
        self.prompt_template = ChatPromptTemplate.from_template("""
        You are a Due Diligence expert. Answer the following question based ONLY on the provided context.
        If the answer is not in the context, state that it is not possible to answer.
        
        Question: {question}
        
        Context:
        {context}
        
        Format your response as followed:
        Answer: [Brief, factual answer]
        Confidence: [0.0 to 1.0]
        Citations: [List of specific snippets used]
        """)

    @retry(
        wait=wait_exponential(multiplier=1, min=4, max=60),
        stop=stop_after_attempt(5),
        retry=retry_if_exception_type(Exception), # Standard LangChain/Google errors
        reraise=True
    )
    async def generate_answer(self, project_id: str, question_id: str, question_text: str, collection_name: str = "ALL_DOCS") -> Answer:
        qdrant_client = storage.get_qdrant()
        if not qdrant_client:
            raise Exception("Qdrant client not initialized")

        vector_db = QdrantVectorStore(
            client=qdrant_client,
            collection_name=collection_name,
            embedding=self.embeddings
        )

        # 1. Retrieve relevant chunks
        docs = vector_db.similarity_search_with_score(question_text, k=5)
        
        context_text = "\n---\n".join([d[0].page_content for d in docs])
        
        # 2. Invoke LLM using the prompt template
        chain = self.prompt_template | self.llm
        response = await chain.ainvoke({
            "question": question_text,
            "context": context_text
        })
        
        # 3. Parse LLM response (Handling Gemini 3 List-style content)
        content = response.content
        if isinstance(content, list):
            # Extract text from the first message block
            content = " ".join([block.get("text", "") for block in content if isinstance(block, dict)])
        
        lines = content.split("\n")
        answer_text = ""
        confidence = 0.5
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Robust parsing for Answer
            if line.lower().startswith("answer:"):
                answer_text = line[len("answer:"):].strip()
            elif "**answer:**" in line.lower():
                 answer_text = line.lower().split("answer:**")[-1].strip()
            
            # Robust parsing for Confidence
            elif "confidence:" in line.lower():
                try:
                    # Extract last float from line
                    import re
                    match = re.search(r"(\d+\.\d+)", line)
                    if match:
                        confidence = float(match.group(1))
                except:
                    pass

        # 4. Map citations
        citations = []
        for doc, score in docs:
            citations.append(Citation(
                document_name=doc.metadata.get("document_name", "Unknown"),
                text_snippet=doc.page_content[:200] + "...",
                page_number=doc.metadata.get("page", 0) + 1,
                confidence=float(score)
            ))

        return Answer(
            question_id=question_id,
            project_id=project_id,
            answer_text=answer_text,
            is_answerable="not possible to answer" not in answer_text.lower(),
            citations=citations,
            confidence_score=confidence,
            status=AnswerStatus.AI_GENERATED
        )

generation_service = GenerationService()
