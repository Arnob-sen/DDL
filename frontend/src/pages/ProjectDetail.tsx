import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  ChevronRight,
  Bookmark,
  Shield,
  Zap,
  Activity,
} from "lucide-react";
import { projectApi } from "../services/api";
import AnswerBadge from "../components/AnswerBadge";
import type { Project, Question, Answer } from "../types/types";

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<{
    project: Project;
    questions: Question[];
    answers: Answer[];
  } | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await projectApi.getProjectInfo(projectId);
        setProjectData(response.data);
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleUpdateAnswer = async (
    questionId: string,
    status: "CONFIRMED" | "REJECTED",
  ) => {
    setSubmitting(true);
    try {
      console.log(`Updating question ${questionId} to ${status}`);
      if (projectData) {
        const updatedQuestions = projectData.questions.map((q) =>
          q.id === questionId ? { ...q, status } : q,
        );
        setProjectData({ ...projectData, questions: updatedQuestions });
      }
    } catch (error) {
      console.error("Failed to update answer status:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Activity className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-400 font-medium">
          Loading project intelligence...
        </p>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-2xl text-center">
        <h3 className="text-xl font-bold text-white mb-2">Project Not Found</h3>
        <p className="text-slate-400 mb-6">
          We couldn't retrieve the details for this project.
        </p>
        <button
          onClick={onBack}
          className="text-primary-400 font-bold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { project, questions, answers } = projectData;
  const currentQ = questions[selectedQuestion] || null;
  const currentA = currentQ
    ? answers.find((a) => a.question_id === currentQ.id)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white">{project.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono tracking-widest uppercase">
              {project.id}
            </span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span className="text-sm text-slate-500 italic">
              Scope: {project.document_scope}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-all">
            Export Report
          </button>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary-500/20">
            Submit Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        {/* Questions List */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-slate-800 bg-slate-950/20 sticky top-0 backdrop-blur-sm z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Questionnaire Index ({questions.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-800/50">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuestion(idx)}
                className={`w-full text-left p-4 hover:bg-primary-500/5 transition-all relative group ${
                  selectedQuestion === idx ? "bg-primary-500/10" : ""
                }`}
              >
                {selectedQuestion === idx && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
                )}
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-primary-500 uppercase tracking-tighter">
                    Section {idx + 1}
                  </span>
                  <AnswerBadge status={q.status || "AI_GENERATED"} />
                </div>
                <p
                  className={`text-sm ${selectedQuestion === idx ? "text-white font-medium" : "text-slate-400"} line-clamp-2`}
                >
                  {q.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Answer Area */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto h-full pr-2 custom-scrollbar">
          {currentQ ? (
            <>
              {/* Header / Stats */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-bold text-slate-100 pr-12 line-clamp-2">
                    {currentQ.text}
                  </h4>
                  {currentA && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap
                          className={`w-4 h-4 ${currentA.confidence > 0.8 ? "text-emerald-400" : "text-amber-400"}`}
                        />
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Confidence
                        </span>
                      </div>
                      <span
                        className={`text-lg font-mono font-bold ${currentA.confidence > 0.8 ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {Math.round(currentA.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300"
                        title="Manual Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    {currentA ? (
                      <p className="text-slate-200 leading-relaxed italic text-lg pr-8">
                        "{currentA.answer}"
                      </p>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-500 py-4">
                        <Activity className="w-5 h-5 animate-pulse" />
                        <p>
                          Answer generation in progress or not yet triggered...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Citations */}
              <div className="space-y-3">
                <h5 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Evidence & Citations
                </h5>
                {currentA &&
                currentA.citations &&
                currentA.citations.length > 0 ? (
                  currentA.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:border-primary-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-primary-400" />
                          <span className="text-xs font-semibold text-primary-400">
                            {cite.document_name || "Reference Document"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-1.5 rounded">
                          SIMILARITY {Math.round(cite.score * 100) / 100}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 italic">
                        "{cite.text}"
                      </p>
                      <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-primary-400 font-bold flex items-center gap-1">
                          View Source <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-sm italic py-2">
                    No citations available for this answer.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-auto pt-4 border-t border-slate-800/50">
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateAnswer(currentQ.id, "REJECTED")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl font-bold transition-all shadow-lg shadow-rose-950/20 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Answer
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateAnswer(currentQ.id, "CONFIRMED")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl font-bold transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 italic">
              Select a question to view intelligence
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
