import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import { History, RotateCcw, X, Clock, User, CheckCircle2 } from 'lucide-react';

export default function VersionHistoryModal({ file, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const { openFileInTab, activeProject, setActiveProject } = useStore();

  useEffect(() => {
    fetchVersions();
  }, [file.id]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await api.getFileVersions(file.id);
      setVersions(res.data);
      if (res.data.length > 0) setSelectedVersion(res.data[0]);
    } catch (err) {
      console.error('Failed to load file versions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (versionId) => {
    if (!confirm('Are you sure you want to revert file content to this version?')) return;
    try {
      const res = await api.revertFileVersion(file.id, versionId);
      alert('File successfully reverted to selected version snapshot!');
      if (activeProject) await setActiveProject(activeProject);
      openFileInTab(res.data.file);
      onClose();
    } catch (err) {
      alert('Revert failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-200">Immutable Version History</h3>
              <p className="text-xs text-slate-400 font-mono">{file.path}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List Sidebar */}
          <div className="w-72 border-r border-slate-800 overflow-y-auto p-2 space-y-1 bg-slate-950/40">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading version snapshots...</div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No previous versions saved yet.</div>
            ) : (
              versions.map((v) => {
                const isSelected = selectedVersion?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`p-3 rounded-xl cursor-pointer text-xs transition border ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200'
                        : 'border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium mb-1">
                      <span className="text-slate-200 truncate">{v.commit_message || 'Auto snapshot'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{new Date(v.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Version Detail & Diff Code Preview */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-950">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{selectedVersion.commit_message}</div>
                    <div className="text-[11px] text-slate-400">Author: {selectedVersion.author_username || 'System'}</div>
                  </div>

                  <button
                    onClick={() => handleRevert(selectedVersion.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow shadow-indigo-600/20"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to this Version</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 p-3">
                  <pre className="font-mono text-xs text-cyan-300 whitespace-pre-wrap">
                    {selectedVersion.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                Select a version snapshot on the left to preview code.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
