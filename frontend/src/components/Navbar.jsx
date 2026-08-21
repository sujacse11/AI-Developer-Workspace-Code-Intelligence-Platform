import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Code2, LayoutDashboard, ShieldAlert, LogOut, Sparkles, FolderCode, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout, activeProject } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="h-14 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Project Indicator */}
      <div className="flex items-center space-x-6">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              DevIntelligence AI
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Workspace v1.0</span>
          </div>
        </Link>

        {activeProject && (
          <div className="hidden md:flex items-center px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 space-x-2">
            <FolderCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-slate-200">{activeProject.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 font-mono text-cyan-300">{activeProject.language_stack}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center space-x-1">
        <Link
          to="/dashboard"
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            location.pathname === '/dashboard' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/workspace"
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            location.pathname === '/workspace' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>IDE Workspace</span>
        </Link>

        {user?.is_staff && (
          <Link
            to="/admin"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              location.pathname === '/admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Admin Stats</span>
          </Link>
        )}
      </nav>

      {/* User Info & Actions */}
      <div className="flex items-center space-x-3">
        {user ? (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                {user.username[0].toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">{user.username}</span>
                <span className="text-[10px] text-cyan-400 uppercase font-mono">{user.plan} tier</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
