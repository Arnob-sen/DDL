import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

def test_api():
    key = os.getenv("GOOGLE_API_KEY")
    print(f"Testing with key: {key[:10]}...{key[-4:] if key else 'None'}")
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        res = llm.invoke("Say hello")
        print(f"Success! Response: {res.content}")
    except Exception as e:
        print(f"Failed to call Gemini: {e}")

if __name__ == "__main__":
    test_api()




