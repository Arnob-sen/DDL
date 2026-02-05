import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export const projectApi = {
  createProject: (data: {
    name: string;
    questionnaire_path: string;
    scope: string;
  }) => api.post("/create-project-async", data),

  getProjectInfo: (projectId: string) =>
    api.get(`/get-project-info/${projectId}`),

  indexDocument: (data: { file_path: string; doc_name: string }) =>
    api.post("/index-document-async", data),

  getJobStatus: (jobId: string) => api.get(`/get-request-status/${jobId}`),

  getHealth: () => api.get("/health"),
};

export default api;
