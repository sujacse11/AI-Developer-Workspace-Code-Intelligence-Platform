import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import FileTree from '../components/FileTree';
import MonacoEditor from '../components/MonacoEditor';
import AIDock from '../components/AIDock';
import CollaborationModal from '../components/CollaborationModal';
import { useStore } from '../store/useStore';
import { Sparkles, MessageSquare, X, PanelRightOpen, PanelRightClose } from 'lucide-react';

export default function WorkspacePage() {
  const {
    activeProject, fetchProjects, setActiveProject, openFiles, activeFile,
    openFileInTab, closeFileTab, aiDockOpen, setAIDockOpen, setActiveAIFeature
  } = useStore();

  const [showCollabModal, setShowCollabModal] = useState(false);
  const [commentTargetLine, setCommentTargetLine] = useState(1);

  useEffect(() => {
    if (!activeProject) {
      fetchProjects().then((projs) => {
        if (projs && projs.length > 0) {
          setActiveProject(projs[0]);
        }
      });
    }
  }, []);

  const handleOpenCommentModal = (lineNum) => {
    setCommentTargetLine(lineNum || 1);
    setShowCollabModal(true);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
      <Navbar />

      {/* Main Split IDE Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Sidebar File Tree */}
        <FileTree />

        {/* Center: Open File Tabs + Monaco Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* File Tabs Bar */}
          {openFiles.length > 0 && (
            <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center px-2 space-x-1 overflow-x-auto select-none">
              {openFiles.map((file) => {
                const isActive = activeFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => openFileInTab(file)}
                    className={`group flex items-center space-x-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t border-x transition ${
                      isActive
                        ? 'bg-slate-950 text-cyan-300 font-medium border-slate-800 border-b-transparent'
                        : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-mono text-[11px] truncate max-w-xs">{file.path}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFileTab(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 rounded transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Monaco Editor Component */}
          <MonacoEditor onOpenCommentModal={handleOpenCommentModal} />

          {/* Bottom IDE Floating Quick Action Dock */}
          <div className="h-9 bg-slate-900/90 border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCollabModal(true)}
                className="flex items-center space-x-1.5 text-slate-400 hover:text-cyan-400 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Collaboration & Team</span>
              </button>

              <div className="h-3 w-px bg-slate-800" />

              <span className="font-mono text-[11px] text-slate-500">
                {activeFile ? `Line 1, Col 1 | ${activeFile.language}` : 'Ready'}
              </span>
            </div>

            {/* AI Dock Toggle Button */}
            <button
              onClick={() => setAIDockOpen(!aiDockOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{aiDockOpen ? 'Hide AI Assistant' : 'Show AI Assistant'}</span>
              {aiDockOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right: AI Intelligence Dock */}
        <AIDock />
      </div>

      {/* Collaboration Modal */}
      {showCollabModal && (
        <CollaborationModal
          initialLineNumber={commentTargetLine}
          onClose={() => setShowCollabModal(false)}
        />
      )}
    </div>
  );
}
