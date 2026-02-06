export type ProjectStatus = "COMPLETED" | "PROCESSING" | "OUTDATED" | "FAILED";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  updated_at: string;
  question_count?: number;
  answered_count?: number;
  document_scope: string;
}

export interface Question {
  id: string;
  project_id: string;
  text: string;
  status: "AI_GENERATED" | "MANUAL_UPDATED" | "CONFIRMED" | "REJECTED";
  order: number;
}

export interface Citation {
  document_name: string;
  text_snippet: string;
  page_number?: number;
  confidence: number;
}

export interface Answer {
  id: string;
  project_id: string;
  question_id: string;
  answer_text: string;
  confidence_score: number;
  citations: Citation[];
}

export interface Document {
  id: string;
  name?: string;
  filename?: string;
  status: string;
  chunks_count: number;
  size?: string;
}
