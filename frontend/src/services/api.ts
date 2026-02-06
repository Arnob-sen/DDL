import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export const projectApi = {
  // Project Management
  createProject: (data: {
    name: string;
    questionnaire_path: string;
    scope: string;
  }) => api.post("/create-project-async", data),

  getProjectInfo: (projectId: string) =>
    api.get(`/get-project-info/${projectId}`),

  getProjectStatus: (projectId: string) =>
    api.get(`/get-project-status/${projectId}`),

  updateProject: (projectId: string, data: Record<string, any>) =>
    api.post("/update-project-async", { project_id: projectId, ...data }),

  listProjects: () => api.get("/projects"),

  listDocuments: () => api.get("/documents"),

  // Answer Generation
  generateSingleAnswer: (projectId: string, questionId: string) =>
    api.post("/generate-single-answer", {
      project_id: projectId,
      question_id: questionId,
    }),

  generateAllAnswers: (projectId: string) =>
    api.post("/generate-all-answers", { project_id: projectId }),

  updateAnswer: (projectId: string, questionId: string, answer: string) =>
    api.post("/update-answer", {
      project_id: projectId,
      question_id: questionId,
      answer: answer,
    }),

  // Document Indexing
  indexDocument: (data: { file_path: string; doc_name: string }) =>
    api.post("/index-document-async", data),

  // Job Tracking
  getJobStatus: (jobId: string) => api.get(`/get-request-status/${jobId}`),

  getHealth: () => api.get("/health"),
};

export default api;
