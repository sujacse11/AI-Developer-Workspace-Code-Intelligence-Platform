import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import { MessageSquare, UserPlus, Users, X, Send, CheckCircle2 } from 'lucide-react';

export default function CollaborationModal({ initialLineNumber = 1, onClose }) {
  const { activeProject, activeFile } = useStore();
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'members'
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [selectedLine, setSelectedLine] = useState(initialLineNumber);

  // Members state
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [role, setRole] = useState('editor');

  useEffect(() => {
    if (activeFile?.id) fetchComments();
    if (activeProject?.id) fetchMembers();
  }, [activeFile?.id, activeProject?.id]);

  const fetchComments = async () => {
    try {
      const res = await api.getFileComments(activeFile.id);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.getProjectMembers(activeProject.id);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    try {
      await api.addFileComment(activeFile.id, {
        line_number: selectedLine,
        body: commentBody
      });
      setCommentBody('');
      fetchComments();
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberInput.trim()) return;

    try {
      await api.addProjectMember(activeProject.id, {
        username_or_email: memberInput.trim(),
        role
      });
      setMemberInput('');
      fetchMembers();
      alert('Team member updated/invited successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'comments' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Line Comments ({comments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'members' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Members ({members.length})</span>
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Line Comments */}
        {activeTab === 'comments' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-950 space-y-4">
            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-semibold">Attach to Line:</span>
                <input
                  type="number"
                  min={1}
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(parseInt(e.target.value) || 1)}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-cyan-400 text-xs"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type code review comment or suggestion..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No line comments attached to this file yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200">{c.author_username}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[10px]">Line {c.line_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{c.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Project Members & Roles */}
        {activeTab === 'members' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-950 space-y-4">
            {/* Invite Form */}
            <form onSubmit={handleAddMember} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Invite Team Member to Project</span>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Username or Email address..."
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 text-xs text-slate-200"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>
            </form>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {members.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {m.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{m.username}</div>
                      <div className="text-[10px] text-slate-500">{m.email}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono text-[10px] uppercase font-bold">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
