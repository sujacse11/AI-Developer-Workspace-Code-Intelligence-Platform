import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import { FileCode, Plus, Folder, Upload, Download, Trash2, RefreshCw, FolderPlus, Layers } from 'lucide-react';

export default function FileTree() {
  const { projects, activeProject, openFiles, activeFile, openFileInTab, closeFileTab, setActiveProject, fetchProjects } = useStore();
  const [newFileName, setNewFileName] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjStack, setNewProjStack] = useState('python');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

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
      const rawInput = newFileName.trim();
      // Check if user entered multiple files separated by comma or newlines
      const filePaths = rawInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

      if (filePaths.length > 1 || isBatchMode) {
        const payloadFiles = filePaths.map(p => {
          const ext = p.split('.').pop() || 'py';
          let lang = 'python';
          if (['js', 'jsx'].includes(ext)) lang = 'javascript';
          if (['ts', 'tsx'].includes(ext)) lang = 'typescript';
          if (ext === 'sql') lang = 'sql';
          if (ext === 'html') lang = 'html';
          if (ext === 'css') lang = 'css';
          return { path: p, language: lang, content: `# File created: ${p}\n` };
        });

        const res = await api.batchCreateFiles(activeProject.id, payloadFiles);
        setNewFileName('');
        setShowNewFileForm(false);
        await setActiveProject(activeProject);
        if (res.data.created_files && res.data.created_files.length > 0) {
          openFileInTab(res.data.created_files[0]);
        }
      } else {
        const singlePath = filePaths[0] || rawInput;
        const ext = singlePath.split('.').pop() || 'py';
        let lang = 'python';
        if (['js', 'jsx'].includes(ext)) lang = 'javascript';
        if (['ts', 'tsx'].includes(ext)) lang = 'typescript';
        if (ext === 'sql') lang = 'sql';
        if (ext === 'html') lang = 'html';
        if (ext === 'css') lang = 'css';

        const res = await api.createFile(activeProject.id, {
          path: singlePath,
          language: lang,
          content: `# File created: ${singlePath}\n`
        });

        setNewFileName('');
        setShowNewFileForm(false);
        await setActiveProject(activeProject);
        openFileInTab(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create file(s)');
    }
  };

  const handleCreateProjectInline = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    try {
      const res = await api.createProject({
        name: newProjName.trim(),
        language_stack: newProjStack,
        visibility: 'private'
      });
      setShowNewProjectModal(false);
      setNewProjName('');
      await fetchProjects();
      await setActiveProject(res.data);
    } catch (err) {
      alert('Failed to create project');
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

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

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

  const handleExportZip = async () => {
    try {
      const response = await api.downloadZipBlob(activeProject.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const fallbackUrl = api.downloadZipUrl(activeProject.id);
      window.open(fallbackUrl, '_blank');
    }
  };

  return (
    <div className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-full select-none">
      {/* Project Switcher Bar */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <select
          value={activeProject.id}
          onChange={async (e) => {
            const chosen = projects.find(p => p.id === parseInt(e.target.value));
            if (chosen) await setActiveProject(chosen);
          }}
          className="bg-slate-900 border border-slate-700/80 text-cyan-300 font-bold text-xs rounded px-2 py-1 flex-1 mr-1 truncate focus:outline-none"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowNewProjectModal(true)}
          title="New Project"
          className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* File Tree Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-200">
          <Folder className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Files</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setIsBatchMode(false);
              setShowNewFileForm(!showNewFileForm);
            }}
            title="Create Single File"
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setIsBatchMode(true);
              setShowNewFileForm(true);
            }}
            title="Batch Create Multiple Files"
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          
          <label title="Import Source / Zip Files" className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              multiple
              accept=".zip,.py,.js,.jsx,.ts,.tsx,.sql,.html,.css,.json,.md,.cpp,.c,.java,.go,.rs,.php,.cs,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
            />
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

      {/* New File / Batch Files Inline Form */}
      {showNewFileForm && (
        <form onSubmit={handleCreateFile} className="p-2 border-b border-slate-800 bg-slate-950/60 space-y-1.5">
          <div className="text-[10px] text-cyan-400 font-bold uppercase">
            {isBatchMode ? 'Batch Create Multiple Files' : 'Create File'}
          </div>
          {isBatchMode ? (
            <textarea
              rows={3}
              placeholder="e.g. app.py, utils.py, tests/test_app.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
              className="w-full bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          ) : (
            <input
              type="text"
              placeholder="e.g. utils/helper.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
              className="w-full bg-slate-900 border border-cyan-500/40 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          )}
          <div className="flex justify-end space-x-1.5">
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
              {isBatchMode ? 'Create All' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Loading Overlay for Upload */}
      {isUploading && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center space-x-2 text-xs text-indigo-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>Processing uploaded file(s)...</span>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {activeProject.files?.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No files in project yet. Click + or Batch icon to create files.
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

      {/* Inline Quick New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-100 uppercase">Create New Project</h4>
            <form onSubmit={handleCreateProjectInline} className="space-y-2">
              <input
                type="text"
                placeholder="Project Name"
                required
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              />
              <select
                value={newProjStack}
                onChange={(e) => setNewProjStack(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="sql">SQL</option>
                <option value="html">HTML/CSS</option>
              </select>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
