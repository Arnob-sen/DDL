import os
from typing import List, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_qdrant import Qdrant
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient

from ..storage.db import storage
from ..models.models import Answer, Citation, AnswerStatus

class GenerationService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
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

    async def generate_answer(self, project_id: str, question_id: str, question_text: str, collection_name: str = "ALL_DOCS") -> Answer:
        qdrant_client = storage.get_qdrant()
        if not qdrant_client:
            raise Exception("Qdrant client not initialized")

        vector_db = Qdrant(
            client=qdrant_client,
            collection_name=collection_name,
            embeddings=self.embeddings
        )

        # 1. Retrieve relevant chunks
        docs = vector_db.similarity_search_with_score(question_text, k=5)
        
        context_text = "\n---\n".join([d[0].page_content for d in docs])
        
        # 2. Invoke LLM
        response = await self.llm.ainvoke({
            "question": question_text,
            "context": context_text
        })
        
        # 3. Parse LLM response (Basic parsing for skeleton)
        content = response.content
        lines = content.split("\n")
        answer_text = ""
        confidence = 0.5
        
        for line in lines:
            if line.startswith("Answer:"):
                answer_text = line.replace("Answer:", "").strip()
            elif line.startswith("Confidence:"):
                try:
                    confidence = float(line.replace("Confidence:", "").strip())
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
