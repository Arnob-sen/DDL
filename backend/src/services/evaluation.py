from langchain_google_genai import GoogleGenerativeAIEmbeddings
from scipy.spatial.distance import cosine

class EvaluationService:
    def __init__(self):
        # Use the same embedding model as generation
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

    async def evaluate_answer(self, ai_answer_text: str, ground_truth_text: str) -> float:
        if not ai_answer_text or not ground_truth_text:
            return 0.0
            
        # Get embeddings for both
        vec_ai = await self.embeddings.aembed_query(ai_answer_text)
        vec_truth = await self.embeddings.aembed_query(ground_truth_text)
        
        # Calculate Cosine Similarity (1 - cosine distance)
        # Result ranges from 0 to 1 (1 being identical meaning)
        similarity = 1 - cosine(vec_ai, vec_truth)
        return max(0.0, float(similarity))

evaluation_service = EvaluationService()
