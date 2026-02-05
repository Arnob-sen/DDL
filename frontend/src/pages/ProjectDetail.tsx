import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  ChevronRight,
  Bookmark,
  Shield,
  Zap,
} from "lucide-react";

interface ProjectDetailProps {
  onBack: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ onBack }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  const questions = [
    {
      id: 1,
      section: "General Info",
      text: "What is the legal name of the entity managing the fund?",
      answer:
        "The primary managing entity is MiniMax Private Equity Partners GP, Limited.",
      confidence: 0.98,
      status: "AI_GENERATED",
      citations: [
        {
          doc: "20260110_MiniMax_Accountants_Report.pdf",
          text: "...entity formally registered as MiniMax Private Equity Partners GP, Limited...",
          page: 2,
        },
      ],
    },
    {
      id: 2,
      section: "Investment Strategy",
      text: "Describe the primary geographic focus of the investment strategy.",
      answer:
        "The strategy primarily targets mid-market technology firms in Southeast Asia, with secondary focus on emerging fintech in India.",
      confidence: 0.85,
      status: "MANUAL_UPDATED",
      citations: [
        {
          doc: "20260110_MiniMax_Global_Prospectus.pdf",
          text: "...focus on the ASEAN region, specifically high-growth tech hubs...",
          page: 14,
        },
      ],
    },
    {
      id: 3,
      section: "Operations",
      text: "What are the current compliance protocols for KYC/AML?",
      answer:
        "The firm uses a multi-tier KYC protocol involving third-party verification and internal audit trails.",
      confidence: 0.92,
      status: "CONFIRMED",
      citations: [
        {
          doc: "20260110_MiniMax_Audited_Financials.pdf",
          text: "...compliance frameworks were audited and found to exceed regulatory minimums...",
          page: 45,
        },
      ],
    },
  ];

  const currentQ = questions[selectedQuestion];

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
          <h2 className="text-3xl font-bold text-white">
            LP Due Diligence - MiniMax
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono tracking-widest uppercase">
              PROJ_20260205_1
            </span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span className="text-sm text-slate-500 italic">
              Scope: ALL_DOCS
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
              Questionnaire Index
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
                    {q.section}
                  </span>
                  <AnswerBadge status={q.status} />
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
          {/* Header / Stats */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-slate-100 pr-12 line-clamp-2">
                {currentQ.text}
              </h4>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <Zap
                    className={`w-4 h-4 ${currentQ.confidence > 0.9 ? "text-emerald-400" : "text-amber-400"}`}
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Confidence
                  </span>
                </div>
                <span
                  className={`text-lg font-mono font-bold ${currentQ.confidence > 0.9 ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {Math.round(currentQ.confidence * 100)}%
                </span>
              </div>
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
                <p className="text-slate-200 leading-relaxed italic text-lg pr-8">
                  "{currentQ.answer}"
                </p>
              </div>
            </div>
          </div>

          {/* Citations */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Evidence & Citations
            </h5>
            {currentQ.citations.map((cite, i) => (
              <div
                key={i}
                className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:border-primary-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary-400" />
                    <span className="text-xs font-semibold text-primary-400">
                      {cite.doc}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-1.5 rounded">
                    PAGE {cite.page}
                  </span>
                </div>
                <p className="text-sm text-slate-400 italic">"{cite.text}"</p>
                <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-primary-400 font-bold flex items-center gap-1">
                    View Source <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-auto pt-4 border-t border-slate-800/50">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl font-bold transition-all shadow-lg shadow-rose-950/20">
              <XCircle className="w-5 h-5" />
              Reject Answer
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl font-bold transition-all shadow-lg shadow-emerald-950/20">
              <CheckCircle className="w-5 h-5" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnswerBadge = ({ status }: { status: string }) => {
  const labels: any = {
    AI_GENERATED: "AI",
    MANUAL_UPDATED: "Manual",
    CONFIRMED: "Ready",
  };
  const styles: any = {
    AI_GENERATED: "text-primary-400",
    MANUAL_UPDATED: "text-amber-400",
    CONFIRMED: "text-emerald-400",
  };

  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-tight ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default ProjectDetail;
