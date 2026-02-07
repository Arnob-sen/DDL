import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"

async def test_list_files():
    print("--- Testing /list-files ---")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/list-files")
            print(f"Status: {response.status_code}")
            print(f"Output: {json.dumps(response.json(), indent=2)}")
        except Exception as e:
            print(f"Error: {e}")

async def test_evaluation():
    print("\n--- Testing /evaluate-project ---")
    # Need a project id and question id. Let's list projects first.
    async with httpx.AsyncClient() as client:
        try:
            projects_resp = await client.get(f"{BASE_URL}/projects")
            projects = projects_resp.json()
            if not projects:
                print("No projects found to evaluate.")
                return
            
            project_id = projects[0]["id"]
            print(f"Evaluating project: {project_id}")
            
            # Get project info to get question ids
            info_resp = await client.get(f"{BASE_URL}/get-project-info/{project_id}")
            info = info_resp.json()
            questions = info.get("questions", [])
            
            if not questions:
                print("No questions found in project.")
                return
            
            q_id = questions[0]["id"]
            # Mock ground truth
            ground_truth = {q_id: "This is a mock ground truth answer that should be somewhat similar."}
            
            eval_resp = await client.post(f"{BASE_URL}/evaluate-project/{project_id}", json=ground_truth)
            print(f"Status: {eval_resp.status_code}")
            print(f"Output: {json.dumps(eval_resp.json(), indent=2)}")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_list_files())
    asyncio.run(test_evaluation())
