import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def list_models():
    key = os.getenv("GOOGLE_API_KEY")
    print(f"Key: {key[:10]}...{key[-4:] if key else 'None'}")
    try:
        genai.configure(api_key=key)
        print("--- All Visible Models ---")
        for m in genai.list_models():
            print(f"Name: {m.name}, Methods: {m.supported_generation_methods}")
    except Exception as e:
        print(f"Failed to list models: {e}")

if __name__ == "__main__":
    list_models()
