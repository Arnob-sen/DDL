import React, { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  ExternalLink,
  Activity,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import type { Project } from "../types/types";
import { projectApi } from "../services/api";
import ActiveJobs from "../components/ActiveJobs";
import CreateProjectModal from "../components/CreateProjectModal";

interface DashboardProps {
  onSelectProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<
    (Project & { last_error?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    outdated: 0,
    failed: 0,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.listProjects();
        const data = response.data as Project[];
        setProjects(data);

        // Calculate stats
        const newStats = data.reduce(
          (acc, p) => {
            acc.total++;
            if (p.status === "COMPLETED") acc.completed++;
            if (p.status === "OUTDATED") acc.outdated++;
            if (p.status === "FAILED") acc.failed++;
            return acc;
          },
          { total: 0, completed: 0, outdated: 0, failed: 0 },
        );
        setStats(newStats);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Project Dashboard</h2>
          <p className="text-slate-400 mt-1">
            Manage and track your questionnaire automations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </div>

      {/* Stats/Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Projects",
            value: stats.total.toString(),
            color: "bg-primary-500/10 text-primary-400",
          },
          {
            label: "Completed",
            value: stats.completed.toString(),
            color: "bg-emerald-500/10 text-emerald-400",
          },
          {
            label: "Outdated",
            value: stats.outdated.toString(),
            color: "bg-amber-500/10 text-amber-400",
          },
          {
            label: "Failed",
            value: stats.failed.toString(),
            color: "bg-rose-500/10 text-rose-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-xl border border-slate-800 bg-slate-900/40 ${stat.color}`}
          >
            <p className="text-sm opacity-80 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Activity className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-primary-400 transition-colors">
                    {project.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono mt-1 block tracking-wider uppercase">
                    {project.id}
                  </span>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Questions</p>
                  <div className="flex items-end gap-2 text-slate-200">
                    <p className="text-xl font-bold">
                      {project.question_count || 0}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Answered</p>
                  <div className="flex items-end gap-2 text-slate-200">
                    <p className="text-xl font-bold">
                      {project.answered_count || 0}
                    </p>
                    <span className="text-xs text-slate-500 mb-1">
                      (
                      {project.question_count
                        ? Math.round(
                            ((project.answered_count ?? 0) /
                              project.question_count) *
                              100,
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>
                    Updated{" "}
                    {new Date(project.updated_at).toLocaleDateString() ||
                      "Just now"}
                  </span>
                </div>
                <button
                  onClick={() => onSelectProject(project.id)}
                  className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-semibold text-sm transition-colors"
                >
                  View Details
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {(project.status === "FAILED" ||
                project.status === "PROCESSING") && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg space-y-3">
                  {project.status === "FAILED" && project.last_error && (
                    <div className="flex items-start gap-3 text-rose-400 text-xs">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p className="font-medium">
                        <span className="font-bold uppercase mr-1">Error:</span>
                        {project.last_error}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      projectApi.resumeProjectGeneration(project.id, false);
                      window.location.reload();
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Resume Generation
                  </button>
                </div>
              )}

              {project.status === "OUTDATED" && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between gap-3 text-amber-400 text-sm">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>
                      New reference documents detected. Answer consistency may
                      be impacted.
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      projectApi.resumeProjectGeneration(project.id, true);
                      // Optionally refresh projects or show a toast
                      window.location.reload();
                    }}
                    className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-bold transition-all"
                  >
                    Regenerate Now
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ActiveJobs />
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Dashboard;
