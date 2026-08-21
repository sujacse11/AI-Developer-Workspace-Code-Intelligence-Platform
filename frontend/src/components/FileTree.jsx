import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import { FileCode, Plus, Folder, Upload, Download, Trash2, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';

export default function FileTree() {
  const { activeProject, openFiles, activeFile, openFileInTab, closeFileTab, setActiveProject } = useStore();
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!activeProject) {
    return (
      <div className="w-64 bg-slate-900/90 border-r border-slate-800/80 p-4 text-xs text-slate-500">
        No active project loaded.
      </div>
    );
  }

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const ext = newFileName.split('.').pop() || 'py';
      let lang = 'python';
      if (['js', 'jsx'].includes(ext)) lang = 'javascript';
      if (['ts', 'tsx'].includes(ext)) lang = 'typescript';
      if (ext === 'sql') lang = 'sql';
      if (ext === 'html') lang = 'html';
      if (ext === 'css') lang = 'css';

      const res = await api.createFile(activeProject.id, {
        path: newFileName.trim(),
        language: lang,
        content: `# File created: ${newFileName}\n`
      });

      setNewFileName('');
      setShowNewFileForm(false);
      
      // Refresh project
      await setActiveProject(activeProject);
      openFileInTab(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create file');
    }
  };

  const handleDeleteFile = async (e, fileId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.deleteFile(fileId);
      closeFileTab(fileId);
      await setActiveProject(activeProject);
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await api.uploadZip(activeProject.id, formData);
      await setActiveProject(activeProject);
      setIsUploading(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleExportZip = () => {
    const url = api.downloadZipUrl(activeProject.id);
    window.open(url, '_blank');
  };

  return (
    <div className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-full select-none">
      {/* File Tree Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-200">
          <Folder className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Files</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowNewFileForm(!showNewFileForm)}
            title="Create File"
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <label title="Import Zip/File" className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".zip,.py,.js,.ts,.sql,.html,.css,.json" onChange={handleZipUpload} className="hidden" />
          </label>

          <button
            onClick={handleExportZip}
            title="Export Zip Archive"
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {showNewFileForm && (
        <form onSubmit={handleCreateFile} className="p-2 border-b border-slate-800 bg-slate-950/60">
          <input
            type="text"
            placeholder="e.g. utils/helper.py"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            className="w-full bg-slate-900 border border-cyan-500/40 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <div className="flex justify-end space-x-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setShowNewFileForm(false)}
              className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-[10px] bg-cyan-500 text-slate-950 rounded font-semibold hover:bg-cyan-400"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Loading Overlay for Upload */}
      {isUploading && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center space-x-2 text-xs text-indigo-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>Parsing uploaded archive...</span>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {activeProject.files?.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No files in project yet. Click + to create one.
          </div>
        ) : (
          activeProject.files?.map((file) => {
            const isActive = activeFile?.id === file.id;
            return (
              <div
                key={file.id}
                onClick={() => openFileInTab(file)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer mb-0.5 transition ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/10 text-cyan-300 font-medium border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate font-mono text-[11.5px]">{file.path}</span>
                </div>

                <button
                  onClick={(e) => handleDeleteFile(e, file.id)}
                  title="Delete File"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
