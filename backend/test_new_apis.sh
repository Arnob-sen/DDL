#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000"
PROJECT_ID="proj_20260206023253" # Using existing project
QUESTION_ID="proj_20260206023253_q_1" # Existing question

echo "--- Testing 1: GET Project Status ---"
curl -s "$BASE_URL/get-project-status/$PROJECT_ID" | jq .
echo -e "\n"

echo "--- Testing 2: POST Update Project ---"
curl -s -X POST "$BASE_URL/update-project-async" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\", \"name\": \"Updated Project Alpha $(date +%H%M)\"}" | jq .
echo -e "\n"

echo "--- Testing 3: POST Generate Single Answer ---"
JOB_GEN_RES=$(curl -s -X POST "$BASE_URL/generate-single-answer" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\", \"question_id\": \"$QUESTION_ID\"}")
echo $JOB_GEN_RES | jq .
JOB_ID=$(echo $JOB_GEN_RES | jq -r .job_id)
echo -e "\n"

if [ "$JOB_ID" != "null" ]; then
    echo "--- Testing 4: GET Request Status (Job: $JOB_ID) ---"
    for i in {1..5}; do
        echo "Checking job status..."
        STATUS_RES=$(curl -s "$BASE_URL/get-request-status/$JOB_ID")
        echo $STATUS_RES | jq .
        if [[ $(echo $STATUS_RES | jq -r .status) == "COMPLETED" ]]; then
            break
        fi
        sleep 2
    done
fi
echo -e "\n"

echo "--- Testing 5: Update Answer (Manual Override) ---"
# First we need an answer id. Let's find one for the project.
ANSWERS_RES=$(curl -s "$BASE_URL/get-project-info/$PROJECT_ID")
ANSWER_ID=$(echo $ANSWERS_RES | jq -r '.answers[0].id // empty')

if [ -z "$ANSWER_ID" ]; then
    echo "No answer found yet. Trying to poll again..."
    sleep 3
    ANSWERS_RES=$(curl -s "$BASE_URL/get-project-info/$PROJECT_ID")
    ANSWER_ID=$(echo $ANSWERS_RES | jq -r '.answers[0].id // empty')
fi

if [ ! -z "$ANSWER_ID" ] && [ "$ANSWER_ID" != "null" ]; then
    echo "Found Answer ID: $ANSWER_ID. Updating..."
    curl -s -X POST "$BASE_URL/update-answer" \
      -H "Content-Type: application/json" \
      -d "{\"answer_id\": \"$ANSWER_ID\", \"answer_text\": \"This is a manually updated answer for testing.\"}" | jq .
else
    echo "Skipping Testing 5: No Answer ID found."
fi
echo -e "\n"

echo "--- Verification: Final Project Info ---"
curl -s "$BASE_URL/get-project-info/$PROJECT_ID" | jq '.project.name, .answers[0].answer_text'
