import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  ShieldAlert, Users, Cpu, DollarSign, ToggleLeft, ToggleRight,
  Gauge, CheckCircle2, XCircle, Settings, Layers, Sparkles
} from 'lucide-react';

const COLORS = ['#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];

export default function AdminDashboardPage() {
  const { user } = useStore();
  const [overview, setOverview] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, usRes, usrRes, stRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminAIUsage(),
        api.getAdminUsers(),
        api.getAdminSettings()
      ]);
      setOverview(ovRes.data.overview);
      setUsage(usRes.data);
      setUsersList(usrRes.data);
      setSettingsData(stRes.data);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await api.toggleAdminUserActive(userId);
      const usrRes = await api.getAdminUsers();
      setUsersList(usrRes.data);
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleToggleFlag = async (featureName, currentVal) => {
    try {
      await api.updateAdminSettings({ feature_name: featureName, is_enabled: !currentVal });
      const stRes = await api.getAdminSettings();
      setSettingsData(stRes.data);
    } catch (err) {
      alert('Failed to update feature flag');
    }
  };

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-200">Access Denied</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1">Staff administrator privileges are required to view system analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Aggregating System Metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <span>Admin Analytics & System Governance</span>
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">AI Token Usage, Costs, Quality Trends, and Action Feature Flags</p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-mono">
            Active Model: {settingsData?.active_model || 'Claude 3.5 Sonnet'}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase">Total Users</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 mt-2">{overview?.total_users || 0}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase">AI Jobs Run</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">{overview?.total_ai_jobs || 0}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase">Tokens Consumed</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-300 mt-2">{(overview?.total_tokens_consumed || 0).toLocaleString()}</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase">Est. Cost (USD)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">${overview?.estimated_cost_usd || '0.00'}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests per AI Action */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Requests per AI Action Feature</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage?.feature_usage || []}>
                  <XAxis dataKey="action_type" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="request_count" radius={[4, 4, 0, 0]}>
                    {usage?.feature_usage?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality Score Breakdown */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Average Quality Score per Feature</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage?.quality_scores || []} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="action_type" type="category" stroke="#64748b" fontSize={10} width={110} />
                  <Tooltip contentStyle={{ background: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="avg_score" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Feature Flags Control Table */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>AI Feature Flags & Access Control</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settingsData?.feature_flags?.map((flag) => (
              <div
                key={flag.id}
                onClick={() => handleToggleFlag(flag.feature_name, flag.is_enabled)}
                className={`p-3 rounded-xl cursor-pointer border flex items-center justify-between transition ${
                  flag.is_enabled
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-950/60 border-rose-500/30 text-slate-500'
                }`}
              >
                <span className="text-xs font-mono">{flag.feature_name}</span>
                {flag.is_enabled ? (
                  <ToggleRight className="w-6 h-6 text-cyan-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-rose-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Governance Table */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>User Management & Activation Governance</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Staff</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{usr.username}</td>
                    <td className="py-2.5 px-3 text-slate-400">{usr.email || 'N/A'}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400 uppercase">{usr.plan}</td>
                    <td className="py-2.5 px-3">{usr.is_staff ? 'Yes' : 'No'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${usr.is_active !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {usr.is_active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleUser(usr.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                      >
                        {usr.is_active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
