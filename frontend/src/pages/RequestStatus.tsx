import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { projectApi } from "../services/api";

interface Job {
  id: string;
  type: string;
  status: "COMPLETED" | "RUNNING" | "PENDING" | "FAILED";
  message: string;
  time: string;
}

const RequestStatus: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Since we don't have a listJobs endpoint, we'll use a placeholder for now
      setJobs([
        {
          id: "job_001",
          type: "PROJECT_CREATION",
          status: "COMPLETED",
          message: "Project created subset successfully",
          time: "2 mins ago",
        },
        {
          id: "job_002",
          type: "INDEXING",
          status: "RUNNING",
          message: "Injesting document: financial_report.pdf",
          time: "Just now",
        },
      ]);
      await projectApi.getHealth();
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Request Status</h2>
          <p className="text-slate-400 mt-1">
            Track asynchronous background tasks and job history
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-mono">
              <th className="px-6 py-4 font-normal">Job ID</th>
              <th className="px-6 py-4 font-normal">Type</th>
              <th className="px-6 py-4 font-normal">Message</th>
              <th className="px-6 py-4 font-normal">Status</th>
              <th className="px-6 py-4 font-normal">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-slate-800/30 transition-colors text-sm"
                >
                  <td className="px-6 py-4 font-mono text-primary-400">
                    {job.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-300">
                    {job.type}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{job.message}</td>
                  <td className="px-6 py-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {job.time}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500 italic"
                >
                  No active requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const JobStatusBadge = ({ status }: { status: Job["status"] }) => {
  const styles: Record<Job["status"], string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse",
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const icons: Record<Job["status"], React.ReactNode> = {
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    RUNNING: <Activity className="w-3 h-3" />,
    PENDING: <Clock className="w-3 h-3" />,
    FAILED: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-widest uppercase w-fit ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </div>
  );
};

export default RequestStatus;
