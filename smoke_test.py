import requests
import time
import os

BASE_URL = "http://localhost:8000"
DATA_DIR = "/media/arnob/New Volume/Dev/DDL/data"

def run_smoke_test():
    print("🚀 Starting Questionnaire Agent Smoke Test...")
    
    # 1. Health Check
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health Check: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return

    # 2. Index Reference Document
    ref_doc = os.path.join(DATA_DIR, "20260110_MiniMax_Industry_Report.pdf")
    payload = {"file_path": ref_doc, "doc_name": "Industry Report"}
    resp = requests.post(f"{BASE_URL}/index-document-async", json=payload)
    job_id = resp.json().get("job_id")
    print(f"📤 Indexing Job Started: {job_id}")

    # Poll status
    while True:
        status = requests.get(f"{BASE_URL}/get-request-status/{job_id}").json()
        print(f"⏳ Indexing Status: {status['status']} - {status.get('message', '')}")
        if status['status'] == 'COMPLETED': break
        if status['status'] == 'FAILED': 
            print("❌ Indexing Failed"); return
        time.sleep(2)

    # 3. Create Project & Generate Answers
    q_doc = os.path.join(DATA_DIR, "ILPA_Due_Diligence_Questionnaire_v1.2.pdf")
    payload = {"name": "ILPA Smoke Test", "questionnaire_path": q_doc, "scope": "ALL_DOCS"}
    resp = requests.post(f"{BASE_URL}/create-project-async", json=payload)
    proj_job_id = resp.json().get("job_id")
    print(f"🏗️ Project Creation Job Started: {proj_job_id}")

    # Poll status
    project_id = None
    while True:
        status = requests.get(f"{BASE_URL}/get-request-status/{proj_job_id}").json()
        print(f"⏳ Project Status: {status['status']} - {status.get('message', '')} ({status.get('progress', 0)*100:.0f}%)")
        if status['status'] == 'COMPLETED':
            project_id = status['result']['project_id']
            break
        if status['status'] == 'FAILED': 
            print("❌ Project Creation Failed"); return
        time.sleep(3)

    # 4. Verify Project Content
    resp = requests.get(f"{BASE_URL}/get-project-info/{project_id}")
    data = resp.json()
    print(f"✅ Project Verified: {len(data['questions'])} questions, {len(data['answers'])} answers generated.")
    
    # 5. Test Transition to OUTDATED
    print("🔄 Testing OUTDATED transition...")
    new_doc = os.path.join(DATA_DIR, "20260110_MiniMax_Accountants_Report.pdf")
    requests.post(f"{BASE_URL}/index-document-async", json={"file_path": new_doc, "doc_name": "New Doc"})
    # Wait a bit for background update
    time.sleep(2)
    status = requests.get(f"{BASE_URL}/get-project-status/{project_id}").json()
    print(f"🚩 New Project Status: {status['status']}")
    
    if status['status'] == 'OUTDATED':
        print("🎉 Smoke Test PASSED!")
    else:
        print("⚠️ Smoke Test: OUTDATED transition not detected immediately.")

if __name__ == "__main__":
    run_smoke_test()
