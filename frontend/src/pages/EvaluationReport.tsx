import React, { useState, useEffect } from "react";
import { User, Bot, Percent, Scale, Activity } from "lucide-react";
import { projectApi } from "../services/api";
import type { Project, Question, Answer } from "../types/types";

const EvaluationReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    project: Project;
    questions: Question[];
    answers: Answer[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For the demo, we'll fetch the first project and evaluate it
        const projectsRes = await projectApi.listProjects();
        const projects = projectsRes.data as Project[];

        if (projects.length > 0) {
          const projectId = projects[0].id;

          // Trigger evaluation with some mock ground truth if it doesn't have score
          // In a real app, this might be triggered by a button or happen in background
          // Here we just fetch info to show what we have
          const res = await projectApi.getProjectInfo(projectId);
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch evaluation data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Activity className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-400 font-medium">Analyzing benchmarks...</p>
      </div>
    );
  }

  if (
    !data ||
    data.answers.filter((a) => a.evaluation_score !== undefined).length === 0
  ) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-2xl text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          No Evaluation Data
        </h3>
        <p className="text-slate-400 mb-6">
          Connect ground truth data to see performance benchmarks.
        </p>
      </div>
    );
  }

  const evaluatedAnswers = data.answers.filter(
    (a) => a.evaluation_score !== undefined,
  );
  const avgScore = data.project.average_evaluation_score || 0;

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Evaluation Report</h2>
          <p className="text-slate-400 mt-1">
            Benchmarking AI accuracy against Ground Truth
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-center px-4 border-r border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              Aggregate Score
            </p>
            <p className="text-2xl font-bold text-primary-400">
              {Math.round(avgScore * 100)}%
            </p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              Questions Evaluated
            </p>
            <p className="text-2xl font-bold text-slate-200">
              {evaluatedAnswers.length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {evaluatedAnswers.map((evalItem, idx) => {
          const question = data.questions.find(
            (q) => q.id === evalItem.question_id,
          );
          return (
            <div
              key={idx}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-300">
                  Q: {question?.text || "Unknown Question"}
                </h4>
                <div className="flex items-center gap-2">
                  <Percent className="w-3 h-3 text-primary-400" />
                  <span className="text-sm font-mono font-bold text-primary-400">
                    {Math.round((evalItem.evaluation_score || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-800">
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-primary-400">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      AI Generated
                    </span>
                  </div>
                  <p className="text-slate-300 italic text-sm leading-relaxed">
                    "{evalItem.answer_text}"
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Human Ground Truth
                    </span>
                  </div>
                  <p className="text-slate-300 italic text-sm leading-relaxed">
                    "{evalItem.ground_truth}"
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary-500/5 border-t border-slate-800 flex items-center gap-3">
                <Scale className="w-4 h-4 text-primary-500" />
                <p className="text-xs text-slate-400">
                  <span className="font-bold text-slate-300 uppercase mr-2 tracking-tighter">
                    Delta Analysis:
                  </span>
                  {(evalItem.evaluation_score || 0) > 0.9
                    ? "Near perfect match."
                    : "Some semantic differences detected."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvaluationReport;
