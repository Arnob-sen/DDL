import re
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from ..models.models import Question

class QuestionnaireParser:
    def parse(self, file_path: str, project_id: str) -> List[Question]:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        full_text = "\n".join([d.page_content for d in documents])
        
        # Simple heuristic: Look for lines starting with "X.Y" or "X." for sections/questions
        # This is a very basic implementation for the skeleton
        lines = full_text.split("\n")
        questions = []
        current_section = "General"
        order = 0
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Detect Section (e.g., "1. General Info")
            section_match = re.match(r"^(\d+)\.\s+(.*)", line)
            if section_match:
                current_section = section_match.group(2)
                continue
            
            # Detect Question (e.g., "1.1 What is your strategy?")
            question_match = re.match(r"^(\d+\.\d+)\s+(.*)", line)
            if question_match:
                order += 1
                questions.append(Question(
                    id=f"{project_id}_q_{order}",
                    project_id=project_id,
                    section=current_section,
                    text=question_match.group(2),
                    order=order
                ))
        
        # Fallback if no questions found (mock data for ILPA demo)
        if not questions:
            questions = [
                Question(id=f"{project_id}_q_1", project_id=project_id, section="General", text="What is the legal name of the entity?", order=1),
                Question(id=f"{project_id}_q_2", project_id=project_id, section="Strategy", text="Describe the investment strategy.", order=2),
                Question(id=f"{project_id}_q_3", project_id=project_id, section="Operations", text="How is the firm's compliance monitored?", order=3),
            ]
            
        return questions

questionnaire_parser = QuestionnaireParser()
