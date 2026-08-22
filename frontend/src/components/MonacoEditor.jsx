import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import { Save, History, Check, Loader2, Sparkles, MessageSquare, Download } from 'lucide-react';
import VersionHistoryModal from './VersionHistoryModal';

const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'cpp', label: 'C / C++' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'csharp', label: 'C#' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'yaml', label: 'YAML' },
  { id: 'dockerfile', label: 'Dockerfile' },
];

export default function MonacoEditor({ onOpenCommentModal }) {
  const { activeFile, updateActiveFileContent, saveCurrentFile, fileSaveStatus, isSavingFile, openFiles, setStoreState } = useStore();
  const editorRef = useRef(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(1);

  // Debounced autosave timer
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile('Manual save via Ctrl+S');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

  const handleEditorChange = (value) => {
    updateActiveFileContent(value || '');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentFile('Debounced autosave');
    }, 1800);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setSelectedLine(e.position.lineNumber);
    });
  };

  const handleLanguageChange = async (newLang) => {
    if (!activeFile) return;
    try {
      const res = await api.saveFile(activeFile.id, {
        current_content: activeFile.current_content,
        language: newLang,
        commit_message: `Updated language stack mode to ${newLang}`
      });
      const updated = res.data;
      useStore.setState((state) => ({
        activeFile: updated,
        openFiles: state.openFiles.map(f => f.id === updated.id ? updated : f)
      }));
    } catch (err) {
      console.error('Failed to update file language', err);
    }
  };

  const handleDownloadSingleFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.current_content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.path.split('/').pop() || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getMonacoLanguage = (langStr) => {
    if (!langStr) return 'python';
    const l = langStr.toLowerCase();
    if (l === 'js' || l === 'jsx') return 'javascript';
    if (l === 'ts' || l === 'tsx') return 'typescript';
    if (l === 'py') return 'python';
    if (l === 'sql') return 'sql';
    if (l === 'html') return 'html';
    if (l === 'css') return 'css';
    if (l === 'json') return 'json';
    if (l === 'md' || l === 'markdown') return 'markdown';
    return l;
  };

  if (!activeFile) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-8 text-center">
        <Sparkles className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-300">No File Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">Select a file from the sidebar file tree or create a new file to start editing with AI code intelligence.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 border-r border-slate-800/80 overflow-hidden relative">
      {/* Editor Sub-Header Toolbar */}
      <div className="h-10 bg-slate-900/80 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-cyan-400 font-medium">{activeFile.path}</span>
          
          {/* Programming Language Selector */}
          <select
            value={getMonacoLanguage(activeFile.language)}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-950 border border-slate-700/60 rounded px-2 py-0.5 text-[11px] text-cyan-300 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            title="Select Programming Language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-slate-500 font-mono">
            {activeFile.size ? `${(activeFile.size / 1024).toFixed(1)} KB` : '0 KB'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Direct File Download Button */}
          <button
            onClick={handleDownloadSingleFile}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition text-[11px]"
            title="Download active file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download</span>
          </button>

          {/* Line Comment Trigger */}
          <button
            onClick={() => onOpenCommentModal && onOpenCommentModal(selectedLine)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition text-[11px]"
            title={`Comment on line ${selectedLine}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Line {selectedLine} Comment</span>
          </button>

          {/* Version History Modal Trigger */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition text-[11px]"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>History ({activeFile.version_count || 1})</span>
          </button>

          {/* Save Status & Button */}
          <button
            onClick={() => saveCurrentFile('Manual save')}
            disabled={isSavingFile}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded font-medium transition text-[11px] ${
              fileSaveStatus === 'dirty'
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}
          >
            {isSavingFile ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Saving...</span>
              </>
            ) : fileSaveStatus === 'dirty' ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save (Ctrl+S)</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Container */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={getMonacoLanguage(activeFile.language)}
          value={activeFile.current_content}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Version History Modal */}
      {showHistoryModal && (
        <VersionHistoryModal
          file={activeFile}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}
