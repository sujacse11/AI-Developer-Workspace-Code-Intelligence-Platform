import { create } from 'zustand';
import { api } from '../api/client';

export const useStore = create((set, get) => ({
  // Auth state
  user: JSON.parse(localStorage.getItem('user_profile')) || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  authLoading: false,
  authError: null,

  login: async (username, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await api.login(username, password);
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_profile', JSON.stringify(user));
      set({ user, isAuthenticated: true, authLoading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Login failed';
      set({ authError: msg, authLoading: false });
      throw new Error(msg);
    }
  },

  register: async (userData) => {
    set({ authLoading: true, authError: null });
    try {
      await api.register(userData);
      // Auto login after registration
      return await get().login(userData.username, userData.password);
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || 'Registration failed';
      set({ authError: msg, authLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    set({ user: null, isAuthenticated: false, activeProject: null, openFiles: [], activeFile: null });
  },

  fetchProfile: async () => {
    try {
      const res = await api.getProfile();
      localStorage.setItem('user_profile', JSON.stringify(res.data));
      set({ user: res.data });
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  },

  // Workspace & Project state
  projects: [],
  activeProject: null,
  openFiles: [], // list of file objects
  activeFile: null,
  isSavingFile: false,
  fileSaveStatus: 'saved', // 'saved' | 'saving' | 'dirty'

  fetchProjects: async () => {
    try {
      const res = await api.getProjects();
      set({ projects: res.data });
      return res.data;
    } catch (err) {
      console.error('Error loading projects', err);
    }
  },

  setActiveProject: async (project) => {
    set({ activeProject: project, openFiles: [], activeFile: null });
    if (project?.id) {
      try {
        const fullProj = await api.getProject(project.id);
        set({ activeProject: fullProj.data });
        if (fullProj.data.files?.length > 0) {
          const first = fullProj.data.files[0];
          set({ openFiles: [first], activeFile: first });
        }
      } catch (err) {
        console.error('Failed to fetch full project details', err);
      }
    }
  },

  openFileInTab: (file) => {
    const { openFiles } = get();
    if (!openFiles.some(f => f.id === file.id)) {
      set({ openFiles: [...openFiles, file], activeFile: file });
    } else {
      set({ activeFile: file });
    }
  },

  closeFileTab: (fileId) => {
    const { openFiles, activeFile } = get();
    const filtered = openFiles.filter(f => f.id !== fileId);
    let nextActive = activeFile;
    if (activeFile?.id === fileId) {
      nextActive = filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }
    set({ openFiles: filtered, activeFile: nextActive });
  },

  updateActiveFileContent: (newContent) => {
    const { activeFile, openFiles } = get();
    if (!activeFile) return;

    const updated = { ...activeFile, current_content: newContent };
    const updatedList = openFiles.map(f => f.id === activeFile.id ? updated : f);
    set({ activeFile: updated, openFiles: updatedList, fileSaveStatus: 'dirty' });
  },

  saveCurrentFile: async (commitMsg = 'Saved via editor') => {
    const { activeFile, fileSaveStatus } = get();
    if (!activeFile || fileSaveStatus === 'saving') return;

    set({ isSavingFile: true, fileSaveStatus: 'saving' });
    try {
      const res = await api.saveFile(activeFile.id, {
        current_content: activeFile.current_content,
        commit_message: commitMsg
      });
      const updatedFile = res.data;
      const { openFiles } = get();
      set({
        activeFile: updatedFile,
        openFiles: openFiles.map(f => f.id === updatedFile.id ? updatedFile : f),
        isSavingFile: false,
        fileSaveStatus: 'saved'
      });
      return updatedFile;
    } catch (err) {
      console.error('Failed to save file', err);
      set({ isSavingFile: false, fileSaveStatus: 'dirty' });
    }
  },

  // AI Dock & Active Feature
  aiDockOpen: true,
  setAIDockOpen: (open) => set({ aiDockOpen: open }),
  activeAIFeature: 'explain_code', // default action
  setActiveAIFeature: (feature) => set({ activeAIFeature: feature, aiDockOpen: true }),
  aiJobResult: null,
  aiJobStatus: null,
  aiJobLoading: false,

  setAIJobState: (state) => set((prev) => ({ ...prev, ...state })),
}));
