import React, { useState } from "react";
import {
  Layout,
  Database,
  FileText,
  BarChart3,
  Settings,
  Activity,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Indexing from "./pages/Indexing";
import ProjectDetail from "./pages/ProjectDetail";
import EvaluationReport from "./pages/EvaluationReport";
import RequestStatus from "./pages/RequestStatus";

type TabId = "dashboard" | "indexing" | "evaluation" | "jobs";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const renderContent = () => {
    if (selectedProjectId) {
      return (
        <ProjectDetail
          projectId={selectedProjectId}
          onBack={() => setSelectedProjectId(null)}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard onSelectProject={setSelectedProjectId} />;
      case "indexing":
        return <Indexing />;
      case "evaluation":
        return <EvaluationReport />;
      case "jobs":
        return <RequestStatus />;
      default:
        return <Dashboard onSelectProject={setSelectedProjectId} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-primary-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Questionnaire Agent
          </h1>
        </div>

        <nav className="ml-12 flex items-center gap-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: Database },
            { id: "indexing", label: "Document Index", icon: FileText },
            { id: "evaluation", label: "Evaluation", icon: BarChart3 },
            { id: "jobs", label: "Jobs", icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabId);
                setSelectedProjectId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id && !selectedProjectId
                  ? "bg-primary-500/10 text-primary-400 shadow-[inset_0_0_10px_rgba(14,165,233,0.1)]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto">
          <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs flex justify-between items-center px-8">
        <div>&copy; 2026 Questionnaire Agent Demo • Build v0.1.0-skeleton</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>{" "}
            Backend Online
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>{" "}
            Vector DB Connected
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
