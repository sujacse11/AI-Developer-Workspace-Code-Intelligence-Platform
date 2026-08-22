import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import {
  FolderCode, Sparkles, Gauge, Plus, ArrowRight, Clock,
  CheckCircle2, Code2, Layers, Cpu, FileCode
} from 'lucide-react';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjStack, setNewProjStack] = useState('python');

  const { setActiveProject, fetchProjects } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = async (project) => {
    await setActiveProject(project);
    navigate('/workspace');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const res = await api.createProject({
        name: newProjName.trim(),
        description: newProjDesc.trim(),
        language_stack: newProjStack,
        visibility: 'private'
      });
      setShowCreateModal(false);
      setNewProjName('');
      setNewProjDesc('');
      await setActiveProject(res.data);
      navigate('/workspace');
    } catch (err) {
      alert('Failed to create project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Unified Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const { stats, recent_projects, recent_activities, recent_ai_reviews } = dashboardData || {};

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                <span>{stats?.is_admin_view ? 'System Admin & Platform Dashboard' : 'Developer Workspace Dashboard'}</span>
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </h1>
              {stats?.is_admin_view && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-bold">
                  Admin Oversight Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {stats?.is_admin_view 
                ? 'Full system oversight across all platform projects, user activities, and LLM telemetry statistics.' 
                : 'Manage software projects, track AI reviews, and launch code intelligence.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            {stats?.is_admin_view ? (
              <>
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center space-x-2 transition"
                >
                  <Gauge className="w-4 h-4" />
                  <span>Admin Settings & Usage Stats</span>
                </button>
                <button
                  onClick={() => navigate('/workspace')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Open Global Workspace</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Saved Projects</div>
              <div className="text-2xl font-extrabold text-slate-100 mt-1">{stats?.total_projects || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FolderCode className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Reviews & Jobs Executed</div>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1">{stats?.total_ai_runs || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Code Quality Score</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats?.avg_code_quality_score || 0}/100</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Saved Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-200 flex items-center space-x-2">
              <FolderCode className="w-5 h-5 text-indigo-400" />
              <span>Saved Projects</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent_projects?.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-slate-500 glass-card rounded-2xl">
                No projects created yet. Click "Create New Project" to start!
              </div>
            ) : (
              recent_projects?.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleOpenWorkspace(proj)}
                  className="glass-card p-5 rounded-2xl border border-slate-800/90 hover:border-cyan-500/40 cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition truncate">{proj.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-400 uppercase border border-slate-700">
                        {proj.language_stack}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{proj.description || 'No description set.'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span>{proj.file_count || 1} File(s)</span>
                    <span className="flex items-center text-cyan-400 group-hover:translate-x-1 transition font-semibold">
                      <span>Launch IDE</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity & Recent Reviews Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Audit Activities */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Activity Audit Trail</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recent_activities?.map((act) => (
                <div key={act.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-300 capitalize">{act.action_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">Target: {act.target_type} ({act.target_id})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(act.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent AI Reviews */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Recent AI Intelligence Runs</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recent_ai_reviews?.map((rev) => (
                <div key={rev.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300 font-mono">{rev.action_type}</span>
                    {rev.score && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Score: {rev.score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 line-clamp-1">{rev.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Create New Workspace Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Realtime Processing Microservice"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of application stack..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Primary Language Stack</label>
                <select
                  value={newProjStack}
                  onChange={(e) => setNewProjStack(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript / Node.js</option>
                  <option value="typescript">TypeScript</option>
                  <option value="sql">SQL / Database Schema</option>
                  <option value="html">HTML5 / CSS3</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow shadow-cyan-500/20"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
