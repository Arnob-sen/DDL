from langchain_google_genai import GoogleGenerativeAIEmbeddings, GoogleGenerativeAIError
from scipy.spatial.distance import cosine
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

def is_retryable_error(exception):
    return isinstance(exception, GoogleGenerativeAIError) and ("429" in str(exception) or "RESOURCE_EXHAUSTED" in str(exception))

class EvaluationService:
    def __init__(self):
        # Use the same embedding model as generation
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

    @retry(
        retry=retry_if_exception(is_retryable_error),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        stop=stop_after_attempt(10)
    )
    async def _get_embedding_with_retry(self, text: str):
        return await self.embeddings.aembed_query(text)

    async def evaluate_answer(self, ai_answer_text: str, ground_truth_text: str) -> float:
        if not ai_answer_text or not ground_truth_text:
            return 0.0
            
        # Get embeddings for both with retry logic
        # We need to catch the specific error that Langchain wraps or re-raises
        try:
            vec_ai = await self._get_embedding_with_retry(ai_answer_text)
            vec_truth = await self._get_embedding_with_retry(ground_truth_text)
        except Exception as e:
            print(f"Failed to get embeddings after retries: {e}")
            # Fallback or re-raise? For evaluation, maybe returning 0 is safer but misleading. 
            # Re-raising is better to eventually fail the job properly.
            raise e
        
        # Calculate Cosine Similarity (1 - cosine distance)
        # Result ranges from 0 to 1 (1 being identical meaning)
        if not vec_ai or not vec_truth:
            return 0.0
            
        similarity = 1 - cosine(vec_ai, vec_truth)
        return max(0.0, float(similarity))

evaluation_service = EvaluationService()
