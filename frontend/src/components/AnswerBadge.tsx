import React from "react";

interface AnswerBadgeProps {
  status: string;
}

const AnswerBadge: React.FC<AnswerBadgeProps> = ({ status }) => {
  const labels: Record<string, string> = {
    AI_GENERATED: "AI",
    MANUAL_UPDATED: "Manual",
    CONFIRMED: "Ready",
  };
  const styles: Record<string, string> = {
    AI_GENERATED: "text-primary-400",
    MANUAL_UPDATED: "text-amber-400",
    CONFIRMED: "text-emerald-400",
  };

  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-tight ${styles[status] || "text-slate-400"}`}
    >
      {labels[status] || status}
    </span>
  );
};

export default AnswerBadge;
