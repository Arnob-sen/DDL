import React, { useState } from "react";
import {
  Upload,
  File,
  CheckCircle,
  Clock,
  X,
  Terminal,
  Search,
} from "lucide-react";

const Indexing: React.FC = () => {
  const [documents] = useState([
    {
      name: "20260110_MiniMax_Accountants_Report.pdf",
      status: "INDEXED",
      type: "Reference",
      size: "420 KB",
    },
    {
      name: "20260110_MiniMax_Audited_Financials.pdf",
      status: "INDEXED",
      type: "Reference",
      size: "11.5 MB",
    },
    {
      name: "20260110_MiniMax_Global_Prospectus.pdf",
      status: "INDEXED",
      type: "Reference",
      size: "6.8 MB",
    },
    {
      name: "ILPA_Due_Diligence_Questionnaire_v1.2.pdf",
      status: "READY",
      type: "Questionnaire",
      size: "624 KB",
    },
  ]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white">Document Management</h2>
        <p className="text-slate-400 mt-1">
          Ingest and index documents for RAG context
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-primary-500/50 transition-all cursor-pointer">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="font-bold text-lg">Upload New Document</h3>
            <p className="text-slate-500 text-sm mt-2">
              Drag and drop PDF files here or click to browse
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary-400" />
              Indexing Rules
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-primary-500">•</span>
                <span>Automatic chunking (1000 chars)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">•</span>
                <span>Multi-layer vector storage</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">•</span>
                <span>Context scoping support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Index Table */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-lg">Indexed Corpus</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500 transition-all w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-mono">
                  <th className="px-6 py-4 font-normal">File Name</th>
                  <th className="px-6 py-4 font-normal">Type</th>
                  <th className="px-6 py-4 font-normal">Status</th>
                  <th className="px-6 py-4 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {documents.map((doc, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {doc.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {doc.size}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight ${
                          doc.type === "Questionnaire"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {doc.status === "INDEXED" ? (
                          <div className="flex items-center gap-2 text-emerald-400 text-xs">
                            <CheckCircle className="w-4 h-4" />
                            INDEXED
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-400 text-xs">
                            <Clock className="w-4 h-4" />
                            READY
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Indexing;
