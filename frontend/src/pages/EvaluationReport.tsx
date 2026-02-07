import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
} from "lucide-react";
import { projectApi } from "../services/api";
import type { Project, Answer } from "../types/types";

const EvaluationReport: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [metrics, setMetrics] = useState({ avgScore: 0, count: 0 });

  // 1. Fetch Projects on Load
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.listProjects();
        // Filter for completed projects only
        const completed = res.data.filter(
          (p: Project) => p.status === "COMPLETED",
        );
        setProjects(completed);
        if (completed.length > 0) {
          setSelectedProjectId(completed[0].id);
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };
    fetchProjects();
  }, []);

  // 2. Fetch Evaluation Data when Project Selected
  const fetchEvaluationData = async (projectId: string) => {
    setLoading(true);
    try {
      const res = await projectApi.getProjectInfo(projectId);
      const fetchedAnswers: Answer[] = res.data.answers;
      setAnswers(fetchedAnswers);

      // Calculate simple local metrics if backend hasn't aggregated them yet
      const scoredAnswers = fetchedAnswers.filter(
        (a) => a.evaluation_score !== undefined,
      );
      const total = scoredAnswers.reduce(
        (sum, a) => sum + (a.evaluation_score || 0),
        0,
      );

      setMetrics({
        avgScore: scoredAnswers.length
          ? (total / scoredAnswers.length) * 100
          : 0,
        count: scoredAnswers.length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchEvaluationData(selectedProjectId);
    }
  }, [selectedProjectId]);

  // 3. The Function to Simulate "Ground Truth" and Run Evaluation
  const handleRunSimulation = async () => {
    if (!selectedProjectId) return;
    setEvaluating(true);

    try {
      // MOCK GROUND TRUTH GENERATOR
      // In a real app, this would come from a CSV upload.
      // Here, we just take the AI answer and slightly tweak it or keep it same
      // to simulate a "Human Correct Answer" for the demo.
      const mockGroundTruth: Record<string, string> = {};

      answers.forEach((a) => {
        // We pretend the "Human" answer is the same as AI answer
        // but we assume 80% similarity for demo purposes to show variation in the UI
        mockGroundTruth[a.question_id] =
          a.answer_text || "Standard answer text.";
      });

      // Call the Backend Endpoint
      await projectApi.evaluateProject(selectedProjectId, mockGroundTruth);

      // Refresh the view
      await fetchEvaluationData(selectedProjectId);
    } catch (err) {
      console.error("Evaluation failed", err);
      alert("Failed to run evaluation simulation.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Evaluation Report</h2>
          <p className="text-slate-400 mt-1">
            Benchmarking AI accuracy against Human Ground Truth
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {projects.length === 0 && <option>No Completed Projects</option>}
          </select>
        </div>
      </div>

      {metrics.count === 0 ? (
        // EMPTY STATE: Show Button to Run Simulation
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No Evaluation Data
          </h3>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            This project has not been benchmarked yet. In a production
            environment, you would upload a "Gold Standard" answer key (CSV).
          </p>
          <button
            onClick={handleRunSimulation}
            disabled={evaluating || !selectedProjectId}
            className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all disabled:opacity-50"
          >
            {evaluating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {evaluating ? "Calculating Scores..." : "Run Benchmark Simulation"}
          </button>
          <p className="text-xs text-slate-600 mt-4 italic">
            * This will simulate a ground truth upload using the backend's
            embedding engine.
          </p>
        </div>
      ) : (
        // RESULTS STATE
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Average Accuracy
              </p>
              <div className="flex items-end gap-3">
                <span
                  className={`text-4xl font-bold ${metrics.avgScore > 80 ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {Math.round(metrics.avgScore)}%
                </span>
                <span className="text-sm text-slate-400 mb-1">
                  Cosine Similarity
                </span>
              </div>
            </div>
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Questions Evaluated
              </p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-white">
                  {metrics.count}
                </span>
                <span className="text-sm text-slate-400 mb-1">Total items</span>
              </div>
            </div>
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Status
                </p>
                <p className="text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Benchmarked
                </p>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={evaluating}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                Re-run
              </button>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-mono">
                  <th className="px-6 py-4 font-normal">Score</th>
                  <th className="px-6 py-4 font-normal">
                    Question / Answer Analysis
                  </th>
                  <th className="px-6 py-4 font-normal">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {answers.map((ans) => {
                  const score = (ans.evaluation_score || 0) * 100;
                  return (
                    <tr
                      key={ans.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 align-top w-24">
                        <div
                          className={`font-mono font-bold text-lg ${score > 85 ? "text-emerald-400" : score > 60 ? "text-amber-400" : "text-rose-400"}`}
                        >
                          {Math.round(score)}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                          Question
                        </p>
                        <p className="text-slate-200 font-medium mb-3 text-sm">
                          {ans.question_id}
                        </p>{" "}
                        {/* Ideally fetch Question Text map here */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                            <p className="text-[10px] text-primary-400 font-bold uppercase mb-1">
                              AI Generated
                            </p>
                            <p className="text-xs text-slate-400 italic leading-relaxed">
                              "{ans.answer_text?.substring(0, 150)}..."
                            </p>
                          </div>
                          <div className="bg-emerald-950/10 p-3 rounded-lg border border-emerald-900/20">
                            <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">
                              Ground Truth
                            </p>
                            <p className="text-xs text-slate-400 italic leading-relaxed">
                              "
                              {ans.ground_truth ||
                                ans.answer_text?.substring(0, 150)}
                              ..."
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {score > 90 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wide border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wide border border-amber-500/20">
                            <XCircle className="w-3 h-3" /> Variant
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationReport;
