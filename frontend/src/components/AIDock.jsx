import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  Sparkles, Play, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert,
  FileCode, Cpu, Code2, Wrench, Bug, FileCheck, Layers, Gauge,
  MessageSquareCode, HelpCircle, ArrowRight, Copy, Check
} from 'lucide-react';

const AI_FEATURES = [
  { id: 'explain_code', label: 'Explain Code', icon: HelpCircle, desc: 'Natural language breakdown of logic and operations' },
  { id: 'find_bugs', label: 'Find Bugs', icon: Bug, desc: 'Scan code for runtime errors and logical flaws' },
  { id: 'fix_bugs', label: 'Fix Bugs & Patch', icon: Wrench, desc: 'Auto-apply patches and structural bug fixes' },
  { id: 'optimize_code', label: 'Optimize Code', icon: Cpu, desc: 'Refactor for speed, CPU efficiency, and lower RAM' },
  { id: 'generate_code', label: 'Generate Code', icon: Sparkles, desc: 'Synthesize new code from natural language prompts' },
  { id: 'convert_code', label: 'Convert Language', icon: Code2, desc: 'Translate code between Python, JS, TS, SQL, etc.' },
  { id: 'generate_comments', label: 'Generate Comments', icon: MessageSquareCode, desc: 'Add inline documentation and docstrings' },
  { id: 'generate_docs', label: 'Generate Docs', icon: FileCheck, desc: 'Produce comprehensive Markdown documentation' },
  { id: 'generate_tests', label: 'Generate Tests', icon: FileCode, desc: 'Synthesize Pytest / Jest unit test suites' },
  { id: 'generate_sql', label: 'Generate SQL', icon: Layers, desc: 'Build optimized SQL queries from schema intent' },
  { id: 'explain_error', label: 'Explain Error', icon: AlertTriangle, desc: 'Debug error tracebacks and receive step-by-step fixes' },
  { id: 'detect_security', label: 'Detect Security Vulnerabilities', icon: ShieldAlert, desc: 'Scan for OWASP & CWE vulnerability risks' },
  { id: 'code_quality', label: 'Code Quality Score', icon: Gauge, desc: 'Calculate overall Maintainability & Quality Index' },
  { id: 'complexity_analysis', label: 'Complexity Analysis', icon: Cpu, desc: 'Compute Cyclomatic & Cognitive complexity grades' },
  { id: 'ai_code_review', label: 'AI PR Code Review', icon: ShieldCheck, desc: 'Senior engineer style pull request diff review' },
];

export default function AIDock() {
  const {
    activeFile, activeProject, updateActiveFileContent,
    activeAIFeature, setActiveAIFeature, aiDockOpen, setAIDockOpen,
    aiJobResult, aiJobStatus, aiJobLoading, setAIJobState
  } = useStore();

  const [promptText, setPromptText] = useState('');
  const [targetLang, setTargetLang] = useState('typescript');
  const [errorInput, setErrorInput] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedFeature = AI_FEATURES.find(f => f.id === activeAIFeature) || AI_FEATURES[0];

  const handleExecuteAI = async () => {
    if (!activeFile && !['generate_code', 'generate_sql'].includes(activeAIFeature)) {
      alert('Please open or select a file first.');
      return;
    }

    setAIJobState({ aiJobLoading: true, aiJobStatus: 'queued', aiJobResult: null });

    try {
      const payload = {
        action: activeAIFeature,
        project_id: activeProject?.id,
        file_id: activeFile?.id,
        code: activeFile?.current_content || '',
        language: activeFile?.language || 'python',
        prompt: promptText,
        error_text: errorInput,
        options: { target_language: targetLang }
      };

      const res = await api.executeAI(payload);
      const jobId = res.data.job_id;

      // Poll for job completion
      const pollInterval = setInterval(async () => {
        try {
          const jobRes = await api.getAIJob(jobId);
          const jobData = jobRes.data;

          setAIJobState({ aiJobStatus: jobData.status });

          if (jobData.status === 'completed') {
            clearInterval(pollInterval);
            setAIJobState({
              aiJobResult: jobData.result,
              aiJobLoading: false,
              aiJobStatus: 'completed'
            });
          } else if (jobData.status === 'failed') {
            clearInterval(pollInterval);
            setAIJobState({
              aiJobLoading: false,
              aiJobStatus: 'failed',
              aiJobResult: { error: jobData.error_message || 'AI processing failed' }
            });
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          setAIJobState({ aiJobLoading: false, aiJobStatus: 'failed' });
        }
      }, 800);

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit AI job');
      setAIJobState({ aiJobLoading: false, aiJobStatus: null });
    }
  };

  const applyPatchedCode = (newCode) => {
    if (!newCode || !activeFile) return;
    updateActiveFileContent(newCode);
    alert('Applied AI code directly into active editor tab!');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!aiDockOpen) return null;

  return (
    <div className="w-96 bg-slate-900/95 border-l border-slate-800/80 flex flex-col h-full overflow-hidden shadow-2xl relative z-20">
      {/* AI Dock Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200">AI Code Intelligence</h2>
            <p className="text-[10px] text-slate-400">15 Async LLM Actions</p>
          </div>
        </div>

        <button
          onClick={() => setAIDockOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      {/* Feature Selector Dropdown */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Select AI Intelligence Action</label>
        <select
          value={activeAIFeature}
          onChange={(e) => setActiveAIFeature(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-cyan-300 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {AI_FEATURES.map((feat) => (
            <option key={feat.id} value={feat.id}>
              {feat.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{selectedFeature.desc}</p>
      </div>

      {/* Contextual Input Controls */}
      <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/30">
        {['generate_code', 'generate_sql'].includes(activeAIFeature) && (
          <div>
            <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Natural Language Prompt</label>
            <textarea
              rows={3}
              placeholder="e.g. Create a helper function that validates email syntax and domain..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {activeAIFeature === 'explain_error' && (
          <div>
            <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Paste Error Message or Traceback</label>
            <textarea
              rows={3}
              placeholder="Paste exception traceback here..."
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono"
            />
          </div>
        )}

        {activeAIFeature === 'convert_code' && (
          <div>
            <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Target Output Language</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="sql">SQL</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
            </select>
          </div>
        )}

        {/* Action Run Button */}
        <button
          onClick={handleExecuteAI}
          disabled={aiJobLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
        >
          {aiJobLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Processing Job ({aiJobStatus})...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Run {selectedFeature.label}</span>
            </>
          )}
        </button>
      </div>

      {/* Structured Output Render Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiJobLoading && (
          <div className="p-6 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-cyan-300">Queued job in background worker...</p>
            <p className="text-[11px] text-slate-500">Evaluating AST nodes, security rules, and code intelligence metrics.</p>
          </div>
        )}

        {!aiJobLoading && !aiJobResult && (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="text-xs text-slate-400">Click <strong className="text-cyan-400">Run {selectedFeature.label}</strong> to trigger AI analysis.</p>
          </div>
        )}

        {!aiJobLoading && aiJobResult && (
          <div className="space-y-4">
            {/* Header Result Pill */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">Execution Completed</span>
              </div>
              {aiJobResult.score !== undefined && (
                <div className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Score: {aiJobResult.score}/100
                </div>
              )}
            </div>

            {/* Summary Banner */}
            {aiJobResult.summary && (
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                {aiJobResult.summary}
              </div>
            )}

            {/* Code Output (Fixes, Refactors, Generated Code, Tests) */}
            {(aiJobResult.patched_code || aiJobResult.optimized_code || aiJobResult.generated_code || aiJobResult.converted_code || aiJobResult.commented_code || aiJobResult.test_code || aiJobResult.sql_query) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Generated Code Output</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => copyToClipboard(aiJobResult.patched_code || aiJobResult.optimized_code || aiJobResult.generated_code || aiJobResult.converted_code || aiJobResult.commented_code || aiJobResult.test_code || aiJobResult.sql_query)}
                      className="p-1 text-slate-400 hover:text-cyan-400 text-[10px] flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    {activeFile && (aiJobResult.patched_code || aiJobResult.optimized_code || aiJobResult.commented_code) && (
                      <button
                        onClick={() => applyPatchedCode(aiJobResult.patched_code || aiJobResult.optimized_code || aiJobResult.commented_code)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[10px] border border-emerald-500/40"
                      >
                        Apply to Editor
                      </button>
                    )}
                  </div>
                </div>

                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto whitespace-pre-wrap max-h-80">
                  {aiJobResult.patched_code || aiJobResult.optimized_code || aiJobResult.generated_code || aiJobResult.converted_code || aiJobResult.commented_code || aiJobResult.test_code || aiJobResult.sql_query}
                </pre>
              </div>
            )}

            {/* Bugs List Render */}
            {aiJobResult.bugs && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bug Findings ({aiJobResult.bugs.length})</span>
                {aiJobResult.bugs.map((b, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 text-[11px]">Line {b.line}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.severity === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        b.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {b.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium">{b.description}</p>
                    <p className="text-slate-400 text-[11px] italic">Suggestion: {b.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Security Vulnerabilities Render */}
            {aiJobResult.vulnerabilities && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vulnerability Scan Findings</span>
                {aiJobResult.vulnerabilities.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-rose-300 font-bold">{v.cwe_id} - Line {v.line}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200">{v.severity}</span>
                    </div>
                    <p className="text-slate-200">{v.description}</p>
                    <p className="text-emerald-300 text-[11px]">Remediation: {v.remediation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Code Quality Breakdown */}
            {aiJobResult.breakdown && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quality Score Breakdown</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(aiJobResult.breakdown).map(([k, val]) => (
                    <div key={k} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{k}</div>
                      <div className="text-sm font-bold text-cyan-400">{val}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Docs Output */}
            {aiJobResult.markdown_docs && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-sans">
                {aiJobResult.markdown_docs}
              </div>
            )}

            {/* Natural Language Explanation */}
            {aiJobResult.explanation && !aiJobResult.markdown_docs && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                {aiJobResult.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
