import React, { useEffect, useState } from "react";
import { Activity, X, AlertCircle } from "lucide-react";
import { projectApi } from "../services/api";

const ActiveJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchActiveJobs = async () => {
    try {
      const response = await projectApi.listActiveJobs();
      setJobs(response.data);
    } catch (err) {
      console.error("Failed to fetch active jobs:", err);
    }
  };

  useEffect(() => {
    fetchActiveJobs();
    const interval = setInterval(fetchActiveJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 z-50 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200">
              Active Tasks ({jobs.length})
            </h3>
          </div>
          <button
            onClick={() => setJobs([])}
            className="text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
          {jobs.map((job) => (
            <div key={job.job_id} className="p-4 space-y-2 group">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {job.type}
                </p>
                <span className="text-[10px] font-mono text-slate-600">
                  {Math.round((job.progress || 0) * 100)}%
                </span>
              </div>
              <p className="text-sm text-slate-200 line-clamp-1">
                {job.message}
              </p>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${(job.progress || 0) * 100}%` }}
                />
              </div>
              {job.error && (
                <div className="flex items-start gap-1.5 text-rose-400 text-[10px] mt-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <p>{job.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveJobs;
