import React, { useState, useEffect } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { projectApi } from "../services/api";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchFiles = async () => {
        setLoading(true);
        try {
          const res = await projectApi.listFiles();
          setFiles(res.data);
          if (res.data.length > 0) setSelectedFile(res.data[0].path);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchFiles();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedFile) return;

    setSubmitting(true);
    try {
      await projectApi.createProject({
        name,
        questionnaire_path: selectedFile,
        scope: "ALL_DOCS",
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            New Questionnaire Project
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2026 Due Diligence"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Select Questionnaire PDF
            </label>
            {loading ? (
              <div className="text-sm text-slate-500">Loading files...</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {files.map((file) => (
                  <label
                    key={file.path}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFile === file.path
                        ? "bg-primary-500/20 border-primary-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="file"
                      value={file.path}
                      checked={selectedFile === file.path}
                      onChange={(e) => setSelectedFile(e.target.value)}
                      className="hidden"
                    />
                    <FileText
                      className={`w-4 h-4 ${selectedFile === file.path ? "text-primary-400" : "text-slate-600"}`}
                    />
                    <span className="text-sm truncate">{file.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Start Generation"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
