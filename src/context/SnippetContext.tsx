import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Snippet, Collection, Tag, Project, File, Definition, WorkspaceFolder, Library, Challenge } from '../types';

interface SnippetContextType {
  snippets: Snippet[];
  tags: Tag[];
  collections: Collection[];
  projects: Project[];
  files: File[];
  workspaceFolders: WorkspaceFolder[];
  definitions: Definition[];
  libraries: Library[];
  challenges: Challenge[];
  trash: {
    snippets: Snippet[];
    files: File[];
    definitions: Definition[];
    collections: Collection[];
    projects: Project[];
    workspaceFolders: WorkspaceFolder[];
    challenges: Challenge[];
  };
  loading: boolean;
  refreshSnippets: () => Promise<void>;
  addSnippet: (snippet: any) => Promise<void>;
  updateSnippet: (id: string, snippet: any) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteSnippet: (id: string, permanent?: boolean) => Promise<void>;
  restoreSnippet: (id: string) => Promise<void>;
  addCollection: (name: string, description?: string) => Promise<void>;
  updateCollection: (id: string, name: string, description?: string) => Promise<void>;
  deleteCollection: (id: string, permanent?: boolean) => Promise<void>;
  restoreCollection: (id: string) => Promise<void>;
  addProject: (name: string, description?: string, status?: string, libraries?: string[], priority?: string, deadline?: number) => Promise<void>;
  updateProject: (id: string, name: string, description?: string, status?: string, libraries?: string[], priority?: string, deadline?: number) => Promise<void>;
  updateProjectContent: (id: string, content: string) => Promise<void>;
  deleteProject: (id: string, permanent?: boolean) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  addFile: (file: any) => Promise<void>;
  updateFile: (id: string, file: any) => Promise<void>;
  deleteFile: (id: string, permanent?: boolean) => Promise<void>;
  restoreFile: (id: string) => Promise<void>;
  addWorkspaceFolder: (name: string, parent_id?: string) => Promise<void>;
  updateWorkspaceFolder: (id: string, name: string, parent_id?: string) => Promise<void>;
  deleteWorkspaceFolder: (id: string, permanent?: boolean) => Promise<void>;
  restoreWorkspaceFolder: (id: string) => Promise<void>;
  addDefinition: (definition: any) => Promise<void>;
  updateDefinition: (id: string, definition: any) => Promise<void>;
  deleteDefinition: (id: string, permanent?: boolean) => Promise<void>;
  restoreDefinition: (id: string) => Promise<void>;
  addChallenge: (challenge: any) => Promise<void>;
  updateChallenge: (id: string, challenge: any) => Promise<void>;
  deleteChallenge: (id: string, permanent?: boolean) => Promise<void>;
  restoreChallenge: (id: string) => Promise<void>;
  getStats: () => Promise<any>;
  filter: {
    search: string;
    language: string;
    tag: string;
    favorite: boolean;
    learning_status: string;
    collection_id: string;
    project_id: string;
    library: string;
    sortBy: string;
  };
  setFilter: (filter: any) => void;
  settings: {
    theme: 'light' | 'dark';
    fontSize: string;
    compactMode: boolean;
    defaultLanguage: string;
    autoSave: boolean;
    autoBackup: boolean;
    appLock: boolean;
    masterPassword?: string;
    wordWrap: boolean;
    showLineNumbers: boolean;
  };
  updateSettings: (settings: any) => void;
  importData: (data: any) => Promise<void>;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

export function SnippetProvider({ children }: { children: ReactNode }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>([]);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [trash, setTrash] = useState<{
    snippets: Snippet[];
    files: File[];
    definitions: Definition[];
    collections: Collection[];
    projects: Project[];
    workspaceFolders: WorkspaceFolder[];
    challenges: Challenge[];
  }>({ snippets: [], files: [], definitions: [], collections: [], projects: [], workspaceFolders: [], challenges: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    language: '',
    tag: '',
    favorite: false,
    learning_status: '',
    collection_id: '',
    project_id: '',
    library: '',
    sortBy: 'newest',
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('codevault_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      fontSize: '14px',
      compactMode: false,
      defaultLanguage: 'JavaScript',
      autoSave: true,
      autoBackup: false,
      appLock: false,
      wordWrap: true,
      showLineNumbers: true
    };
  });

  useEffect(() => {
    localStorage.setItem('codevault_settings', JSON.stringify(settings));
    // Apply theme to body
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (newSettings: any) => {
    setSettings((prev: any) => ({ ...prev, ...newSettings }));
  };

  const fetchSnippets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.search) params.append('search', filter.search);
      if (filter.language) params.append('language', filter.language);
      if (filter.tag) params.append('tag', filter.tag);
      if (filter.favorite) params.append('favorite', 'true');
      if (filter.learning_status) params.append('learning_status', filter.learning_status);
      if (filter.collection_id) params.append('collection_id', filter.collection_id);
      if (filter.project_id) params.append('project_id', filter.project_id);
      if (filter.library) params.append('library', filter.library);

      const res = await fetch(`/api/snippets?${params.toString()}`);
      let data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error('Snippets data is not an array:', data);
        data = [];
      }

      // Apply sorting locally
      if (filter.sortBy === 'newest') {
        data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (filter.sortBy === 'oldest') {
        data.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (filter.sortBy === 'a-z') {
        data.sort((a: any, b: any) => a.title.localeCompare(b.title));
      } else if (filter.sortBy === 'z-a') {
        data.sort((a: any, b: any) => b.title.localeCompare(a.title));
      }

      setSnippets(data);
    } catch (error) {
      console.error('Failed to fetch snippets', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      if (Array.isArray(data)) setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      if (Array.isArray(data)) setCollections(data);
    } catch (error) {
      console.error('Failed to fetch collections', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (Array.isArray(data)) setFiles(data);
    } catch (error) {
      console.error('Failed to fetch files', error);
    }
  };

  const fetchWorkspaceFolders = async () => {
    try {
      const res = await fetch('/api/workspace_folders');
      const data = await res.json();
      if (Array.isArray(data)) setWorkspaceFolders(data);
    } catch (error) {
      console.error('Failed to fetch workspace folders', error);
    }
  };

  const fetchDefinitions = async () => {
    try {
      const res = await fetch('/api/definitions');
      const data = await res.json();
      if (Array.isArray(data)) setDefinitions(data);
    } catch (error) {
      console.error('Failed to fetch definitions', error);
    }
  };

  const fetchLibraries = async () => {
    try {
      const res = await fetch('/api/libraries');
      const data = await res.json();
      if (Array.isArray(data)) setLibraries(data);
    } catch (error) {
      console.error('Failed to fetch libraries', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      if (Array.isArray(data)) setChallenges(data);
    } catch (error) {
      console.error('Failed to fetch challenges', error);
    }
  };

  const fetchTrash = async () => {
    try {
      const [sRes, fRes, dRes, cRes, pRes, wfRes, chRes] = await Promise.all([
        fetch('/api/snippets?includeTrash=true'),
        fetch('/api/files?includeTrash=true'),
        fetch('/api/definitions?includeTrash=true'),
        fetch('/api/collections?includeTrash=true'),
        fetch('/api/projects?includeTrash=true'),
        fetch('/api/workspace_folders?includeTrash=true'),
        fetch('/api/challenges?includeTrash=true')
      ]);
      const [snippets, files, definitions, collections, projects, workspaceFolders, challenges] = await Promise.all([
        sRes.json(),
        fRes.json(),
        dRes.json(),
        cRes.json(),
        pRes.json(),
        wfRes.json(),
        chRes.json()
      ]);
      setTrash({ snippets, files, definitions, collections, projects, workspaceFolders, challenges });
    } catch (error) {
      console.error('Failed to fetch trash', error);
    }
  };

  useEffect(() => {
    fetchSnippets(true);
    fetchTags();
    fetchCollections();
    fetchProjects();
    fetchFiles();
    fetchWorkspaceFolders();
    fetchDefinitions();
    fetchLibraries();
    fetchChallenges();
    fetchTrash();
  }, [filter]);

  const refreshSnippets = async () => {
    // Refresh without showing the global loading spinner to avoid flicker
    await Promise.all([
      fetchSnippets(false),
      fetchTags(),
      fetchCollections(),
      fetchProjects(),
      fetchFiles(),
      fetchWorkspaceFolders(),
      fetchDefinitions(),
      fetchLibraries(),
      fetchChallenges(),
      fetchTrash()
    ]);
  };

  const addSnippet = async (snippet: any) => {
    const tempId = crypto.randomUUID();
    const newSnippet = { 
      ...snippet, 
      id: tempId, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(),
      tags: snippet.tags || [],
      is_favorite: !!snippet.is_favorite
    };
    setSnippets(prev => [newSnippet, ...prev]);
    
    try {
      await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippet),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      console.error('Failed to add snippet', error);
      setSnippets(prev => prev.filter(s => s.id !== tempId));
    }
  };

  const updateSnippet = async (id: string, snippet: any) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, ...snippet, updated_at: Date.now() } : s));
    
    try {
      await fetch(`/api/snippets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippet),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      console.error('Failed to update snippet', error);
      await refreshSnippets();
    }
  };

  const toggleFavorite = async (id: string) => {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    const newFavoriteStatus = !snippet.is_favorite;
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, is_favorite: newFavoriteStatus } : s));

    try {
      await fetch(`/api/snippets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...snippet, is_favorite: newFavoriteStatus }),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      await refreshSnippets();
    }
  };

  const deleteSnippet = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, snippets: prev.snippets.filter(s => s.id !== id) }));
    } else {
      setSnippets(prev => prev.filter(s => s.id !== id));
    }
    
    try {
      const res = await fetch(`/api/snippets/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      console.error('Failed to delete snippet', error);
      await refreshSnippets();
    }
  };

  const restoreSnippet = async (id: string) => {
    try {
      await fetch(`/api/snippets/${id}/restore`, { method: 'POST' });
      await refreshSnippets();
    } catch (error) {
      console.error('Failed to restore snippet', error);
    }
  };

  const addCollection = async (name: string, description?: string) => {
    const tempId = crypto.randomUUID();
    setCollections(prev => [...prev, { id: tempId, name, description, snippet_count: 0 } as any]);
    try {
      await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      await fetchCollections();
    } catch (error) {
      setCollections(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const deleteCollection = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, collections: prev.collections.filter(c => c.id !== id) }));
    } else {
      setCollections(prev => prev.filter(c => c.id !== id));
    }
    try {
      const res = await fetch(`/api/collections/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      await fetchCollections();
    }
  };

  const restoreCollection = async (id: string) => {
    try {
      await fetch(`/api/collections/${id}/restore`, { method: 'POST' });
      await refreshSnippets();
    } catch (error) {
      console.error('Failed to restore collection', error);
    }
  };

  const updateCollection = async (id: string, name: string, description?: string) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, name, description } : c));
    try {
      await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      await fetchCollections();
    } catch (error) {
      await fetchCollections();
    }
  };

  const addProject = async (name: string, description?: string, status?: string, libraries?: string[], priority?: string, deadline?: number) => {
    const tempId = crypto.randomUUID();
    setProjects(prev => [...prev, { id: tempId, name, description, status: status || 'active', priority: priority || 'Medium', deadline: deadline || null, libraries: libraries || [], snippet_count: 0, updated_at: new Date().toISOString() } as any]);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status, libraries, priority, deadline }),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      setProjects(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const updateProject = async (id: string, name: string, description?: string, status?: string, libraries?: string[], priority?: string, deadline?: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, description, status: status || p.status, libraries: libraries || p.libraries, priority: priority || p.priority, deadline: deadline !== undefined ? deadline : p.deadline } : p));
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status, libraries, priority, deadline }),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      await fetchProjects();
    }
  };

  const updateProjectContent = async (id: string, content: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, content } : p));
    try {
      await fetch(`/api/projects/${id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      // No need to fetchProjects here as we already updated it optimistically
    } catch (error) {
      await fetchProjects();
    }
  };

  const deleteProject = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
    try {
      const res = await fetch(`/api/projects/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      await fetchProjects();
    }
  };

  const restoreProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}/restore`, { method: 'POST' });
      await refreshSnippets();
    } catch (error) {
      console.error('Failed to restore project', error);
    }
  };

  const addFile = async (file: any) => {
    const tempId = crypto.randomUUID();
    const newFile = { ...file, id: tempId, created_at: Date.now(), updated_at: Date.now() };
    setFiles(prev => [...prev, newFile]);
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      setFiles(prev => prev.filter(f => f.id !== tempId));
    }
  };

  const updateFile = async (id: string, file: any) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...file, updated_at: Date.now() } : f));
    try {
      await fetch(`/api/files/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      await fetchFiles();
    }
  };

  const deleteFile = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
    } else {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
    try {
      const res = await fetch(`/api/files/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      await fetchFiles();
    }
  };

  const restoreFile = async (id: string) => {
    try {
      await fetch(`/api/files/${id}/restore`, { method: 'POST' });
      await fetchFiles();
    } catch (error) {
      console.error('Failed to restore file', error);
    }
  };

  const addWorkspaceFolder = async (name: string, parent_id?: string) => {
    const tempId = crypto.randomUUID();
    setWorkspaceFolders(prev => [...prev, { id: tempId, name, parent_id, created_at: Date.now(), updated_at: Date.now() }]);
    try {
      await fetch('/api/workspace_folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_id }),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      setWorkspaceFolders(prev => prev.filter(f => f.id !== tempId));
    }
  };

  const updateWorkspaceFolder = async (id: string, updates: any) => {
    setWorkspaceFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates, updated_at: Date.now() } : f));
    try {
      await fetch(`/api/workspace_folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      await fetchWorkspaceFolders();
    }
  };

  const deleteWorkspaceFolder = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, workspaceFolders: prev.workspaceFolders.filter(f => f.id !== id) }));
    } else {
      setWorkspaceFolders(prev => prev.filter(f => f.id !== id));
    }
    try {
      const res = await fetch(`/api/workspace_folders/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      await fetchWorkspaceFolders();
    }
  };

  const restoreWorkspaceFolder = async (id: string) => {
    try {
      await fetch(`/api/workspace_folders/${id}/restore`, { method: 'POST' });
      await fetchWorkspaceFolders();
    } catch (error) {
      console.error('Failed to restore workspace folder', error);
    }
  };

  const addDefinition = async (definition: any) => {
    const tempId = crypto.randomUUID();
    const newDef = { ...definition, id: tempId, created_at: Date.now(), updated_at: Date.now() };
    setDefinitions(prev => [...prev, newDef]);
    try {
      await fetch('/api/definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      setDefinitions(prev => prev.filter(d => d.id !== tempId));
    }
  };

  const updateDefinition = async (id: string, definition: any) => {
    setDefinitions(prev => prev.map(d => d.id === id ? { ...d, ...definition, updated_at: Date.now() } : d));
    try {
      await fetch(`/api/definitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      await fetchDefinitions();
    }
  };

  const deleteDefinition = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, definitions: prev.definitions.filter(d => d.id !== id) }));
    } else {
      setDefinitions(prev => prev.filter(d => d.id !== id));
    }
    try {
      const res = await fetch(`/api/definitions/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      await fetchDefinitions();
    }
  };

  const restoreDefinition = async (id: string) => {
    try {
      await fetch(`/api/definitions/${id}/restore`, { method: 'POST' });
      await fetchDefinitions();
    } catch (error) {
      console.error('Failed to restore definition', error);
    }
  };

  const addChallenge = async (challenge: any) => {
    const tempId = crypto.randomUUID();
    const newChallenge = { ...challenge, id: tempId, created_at: Date.now(), updated_at: Date.now() };
    setChallenges(prev => [...prev, newChallenge]);
    try {
      await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challenge),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      setChallenges(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const updateChallenge = async (id: string, challenge: any) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, ...challenge, updated_at: Date.now() } : c));
    try {
      await fetch(`/api/challenges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challenge),
      });
      // Do not fetch on success to avoid race conditions with optimistic updates
    } catch (error) {
      await fetchChallenges();
    }
  };

  const deleteChallenge = async (id: string, permanent = false) => {
    if (!id) return;
    if (permanent) {
      setTrash(prev => ({ ...prev, challenges: prev.challenges.filter(c => c.id !== id) }));
    } else {
      setChallenges(prev => prev.filter(c => c.id !== id));
    }
    try {
      const res = await fetch(`/api/challenges/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (!permanent) await fetchTrash();
    } catch (error) {
      await fetchChallenges();
    }
  };

  const restoreChallenge = async (id: string) => {
    try {
      await fetch(`/api/challenges/${id}/restore`, { method: 'POST' });
      await fetchChallenges();
    } catch (error) {
      console.error('Failed to restore challenge', error);
    }
  };

  const getStats = async () => {
    const res = await fetch('/api/stats');
    return await res.json();
  };

  const importData = async (data: any) => {
    try {
      if (data.snippets) setSnippets(data.snippets);
      if (data.tags) setTags(data.tags);
      if (data.collections) setCollections(data.collections);
      if (data.projects) setProjects(data.projects);
      if (data.files) setFiles(data.files);
      if (data.workspaceFolders) setWorkspaceFolders(data.workspaceFolders);
      if (data.definitions) setDefinitions(data.definitions);
      if (data.libraries) setLibraries(data.libraries);
      if (data.challenges) setChallenges(data.challenges);
      if (data.settings) setSettings(data.settings);
      
      // Also send to backend if needed
      await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to import data', error);
      throw error;
    }
  };

  return (
    <SnippetContext.Provider value={{ 
      snippets, 
      tags, 
      collections,
      projects,
      files,
      workspaceFolders,
      definitions,
      libraries,
      challenges,
      trash,
      loading, 
      refreshSnippets, 
      addSnippet, 
      updateSnippet, 
      toggleFavorite,
      deleteSnippet,
      restoreSnippet,
      addCollection,
      updateCollection,
      deleteCollection,
      restoreCollection,
      addProject,
      updateProject,
      updateProjectContent,
      deleteProject,
      restoreProject,
      addFile,
      updateFile,
      deleteFile,
      restoreFile,
      addWorkspaceFolder,
      updateWorkspaceFolder,
      deleteWorkspaceFolder,
      restoreWorkspaceFolder,
      addDefinition,
      updateDefinition,
      deleteDefinition,
      restoreDefinition,
      addChallenge,
      updateChallenge,
      deleteChallenge,
      restoreChallenge,
      getStats,
      filter,
      setFilter,
      settings,
      updateSettings,
      importData
    }}>
      {children}
    </SnippetContext.Provider>
  );
}

export function useSnippets() {
  const context = useContext(SnippetContext);
  if (context === undefined) {
    throw new Error('useSnippets must be used within a SnippetProvider');
  }
  return context;
}
