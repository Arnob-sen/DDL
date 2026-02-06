import React, { useState, useEffect } from "react";
import {
  Upload,
  File,
  CheckCircle,
  Clock,
  X,
  Terminal,
  Search,
  Activity,
} from "lucide-react";
import { projectApi } from "../services/api";
import type { Document } from "../types/types";

const Indexing: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<
    { name: string; path: string; size: number }[]
  >([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await projectApi.listDocuments();
        setDocuments(response.data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableFiles = async () => {
      try {
        const response = await projectApi.listFiles();
        setAvailableFiles(response.data);
      } catch (error) {
        console.error("Failed to fetch available files:", error);
      }
    };

    fetchDocuments();
    fetchAvailableFiles();
  }, []);

  const handleIndexDocument = async (filePath: string, docName: string) => {
    setUploading(true);
    try {
      const response = await projectApi.indexDocument({
        file_path: filePath,
        doc_name: docName,
      });
      console.log("Indexing started:", response.data);

      // Refresh list after success
      setTimeout(async () => {
        const updatedDocs = await projectApi.listDocuments();
        setDocuments(updatedDocs.data);
      }, 2000);
    } catch (error) {
      console.error("Indexing failed:", error);
    } finally {
      setUploading(false);
    }
  };

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
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary-400" />
              Available Files
            </h3>
            <div className="space-y-3">
              {availableFiles.length > 0 ? (
                availableFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between group"
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => handleIndexDocument(file.path, file.name)}
                      disabled={uploading}
                      className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 p-2 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No PDF files found in data directory.
                </p>
              )}
            </div>
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
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading corpus...
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-mono">
                    <th className="px-6 py-4 font-normal">File Name</th>
                    <th className="px-6 py-4 font-normal">Status</th>
                    <th className="px-6 py-4 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {documents.length > 0 ? (
                    documents.map((doc: Document, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-200">
                                {doc.name || doc.filename}
                              </p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                {doc.chunks_count || 0} chunks indexed
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {doc.status === "INDEXED" ||
                            doc.status === "COMPLETED" ? (
                              <div className="flex items-center gap-2 text-emerald-400 text-xs">
                                <CheckCircle className="w-4 h-4" />
                                INDEXED
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-400 text-xs">
                                <Clock className="w-4 h-4" />
                                {doc.status || "READY"}
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
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-slate-500 italic"
                      >
                        No documents indexed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Indexing;
