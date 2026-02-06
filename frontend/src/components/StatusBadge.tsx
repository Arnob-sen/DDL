import React from "react";
import { CheckCircle, Activity, AlertTriangle } from "lucide-react";
import type { ProjectStatus } from "../types/types";

interface StatusBadgeProps {
  status: ProjectStatus | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse",
    OUTDATED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const icons: Record<string, React.ReactNode> = {
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    PROCESSING: <Activity className="w-3 h-3" />,
    OUTDATED: <AlertTriangle className="w-3 h-3" />,
    FAILED: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${styles[status] || "bg-slate-800 text-slate-400"}`}
    >
      {icons[status] || <Activity className="w-3 h-3" />}
      {status}
    </div>
  );
};

export default StatusBadge;
