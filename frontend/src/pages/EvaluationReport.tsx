import React from "react";
import { Target, User, Bot, Percent, Scale, TrendingUp } from "lucide-react";

const EvaluationReport: React.FC = () => {
  const evaluations = [
    {
      question: "What is the fund investment life?",
      ai: "The fund has a 10-year term from the final closing date.",
      human: "10 years from final close, with two 1-year extensions.",
      score: 0.88,
      delta: "Missing details about extensions.",
    },
    {
      question: "What is the management fee during the investment period?",
      ai: "The management fee is 2.0% of committed capital.",
      human: "2% of committed capital per annum.",
      score: 0.99,
      delta: "Near perfect match.",
    },
  ];

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
            <p className="text-2xl font-bold text-primary-400">93.5%</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              Questions Evaluated
            </p>
            <p className="text-2xl font-bold text-slate-200">24</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {evaluations.map((evalItem, idx) => (
          <div
            key={idx}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-300">
                Q: {evalItem.question}
              </h4>
              <div className="flex items-center gap-2">
                <Percent className="w-3 h-3 text-primary-400" />
                <span className="text-sm font-mono font-bold text-primary-400">
                  {Math.round(evalItem.score * 100)}%
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
                  "{evalItem.ai}"
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
                  "{evalItem.human}"
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary-500/5 border-t border-slate-800 flex items-center gap-3">
              <Scale className="w-4 h-4 text-primary-500" />
              <p className="text-xs text-slate-400">
                <span className="font-bold text-slate-300 uppercase mr-2 tracking-tighter">
                  Delta Analysis:
                </span>
                {evalItem.delta}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvaluationReport;
