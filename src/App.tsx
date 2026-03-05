import { useState, useEffect } from 'react';
import { SnippetProvider, useSnippets } from './context/SnippetContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Sidebar from './components/Sidebar';
import SnippetCard from './components/SnippetCard';
import SnippetEditor from './components/SnippetEditor';
import StatsView from './components/StatsView';
import ProjectView from './components/ProjectView';
import FolderView from './components/FolderView';
import LanguageView from './components/LanguageView';
import WorkspaceView from './components/WorkspaceView';
import GlossaryView from './components/GlossaryView';
import BoardView from './components/BoardView';
import TrashView from './components/TrashView';
import ChallengesView from './components/ChallengesView';
import Settings from './components/Settings';
import { Search, Plus, Moon, Sun, Download, Lock, ShieldCheck, Command, FileCode, BookOpen, Code as CodeIcon, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

function MainContent() {
  const { snippets, loading, filter, setFilter, settings } = useSnippets();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'stats'
  const [isUnlocked, setIsUnlocked] = useState(!settings.appLock);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any>({ snippets: [], files: [], definitions: [] });
  const [isSearching, setIsSearching] = useState(false);

  const handleUnlock = () => {
    if (passwordInput === (settings.masterPassword || '')) {
      setIsUnlocked(true);
      setPasswordInput('');
    } else {
      alert('Incorrect password');
    }
  };

  useEffect(() => {
    // Apply font size to root
    document.documentElement.style.setProperty('--editor-font-size', settings.fontSize);
    document.documentElement.style.fontSize = settings.fontSize;
  }, [settings.fontSize]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#stats') {
        setView('stats');
      } else if (hash.startsWith('#projects')) {
        setView('projects');
      } else if (hash.startsWith('#folders')) {
        setView('folders');
      } else if (hash.startsWith('#languages')) {
        setView('languages');
      } else if (hash.startsWith('#workspace')) {
        setView('workspace');
      } else if (hash.startsWith('#glossary')) {
        setView('glossary');
      } else if (hash.startsWith('#board')) {
        setView('board');
      } else if (hash.startsWith('#challenges')) {
        setView('challenges');
      } else if (hash === '#favorites') {
        setView('list');
      } else if (hash === '#trash') {
        setView('trash');
      } else if (hash === '#settings') {
        setView('settings');
      } else {
        setView('list');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleOpenEditor = () => {
      setEditingSnippet(null);
      setIsEditorOpen(true);
    };
    window.addEventListener('open-editor', handleOpenEditor);
    return () => window.removeEventListener('open-editor', handleOpenEditor);
  }, []);

  const handleEdit = (snippet: any) => {
    setEditingSnippet(snippet);
    setIsEditorOpen(true);
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snippets));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "codevault_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (globalSearchQuery.trim()) {
        performGlobalSearch();
      } else {
        setGlobalSearchResults({ snippets: [], files: [], definitions: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearchQuery]);

  const performGlobalSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(globalSearchQuery)}`);
      const data = await res.json();
      setGlobalSearchResults(data);
    } catch (error) {
      console.error('Global search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGlobalSearchSelect = (item: any) => {
    setIsGlobalSearchOpen(false);
    setGlobalSearchQuery('');
    if (item.type === 'snippet') {
      window.location.hash = '#list';
      setFilter({ ...filter, search: item.name });
    } else if (item.type === 'file') {
      window.location.hash = '#workspace';
      // We might need a way to select the file in WorkspaceView
      // For now, just navigating there is a start
    } else if (item.type === 'definition') {
      window.location.hash = '#glossary';
      // Same for glossary
    }
  };

  useEffect(() => {
    let backupInterval: NodeJS.Timeout;
    if (settings.autoBackup) {
      backupInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/backup');
          const data = await response.json();
          localStorage.setItem('codevault_autobackup', JSON.stringify({
            timestamp: new Date().toISOString(),
            data
          }));
          console.log('Auto-backup completed');
        } catch (error) {
          console.error('Auto-backup failed', error);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => {
      if (backupInterval) clearInterval(backupInterval);
    };
  }, [settings.autoBackup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Search (Ctrl+K)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
      
      // New Snippet (Ctrl+N)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsEditorOpen(true);
        setEditingSnippet(null);
      }

      // Save (Ctrl+S) - only prevent default if we want to handle it globally
      // In WorkspaceView it's handled locally, but we can add a global "Save All" if needed
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('global-save'));
      }

      // Navigation shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.location.hash = '#projects';
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        window.location.hash = '#glossary';
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        window.location.hash = '#settings';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex-1 ml-64 min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm text-center"
            >
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">CodeVault Locked</h2>
              <p className="text-zinc-400 mb-8 font-medium">Please enter your master password to continue.</p>
              
              <div className="space-y-4">
                <input 
                  type="password" 
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Master Password"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button 
                  onClick={handleUnlock}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Unlock Vault
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="relative w-96 group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <Search className="w-4 h-4 text-zinc-400" />
          </div>
          <input 
            id="global-search-input"
            type="text" 
            placeholder="Search snippets... (Ctrl+K)" 
            value={filter.search}
            readOnly
            onClick={() => setIsGlobalSearchOpen(true)}
            className="w-full pl-10 pr-12 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-bold text-zinc-400 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sort by:</span>
            <select 
              value={filter.sortBy || 'newest'}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="a-z">Title (A-Z)</option>
              <option value="z-a">Title (Z-A)</option>
            </select>
          </div>
          <button 
            onClick={exportData}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            title="Export Backup"
          >
            <Download className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {snippets.length} Snippets
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-73px)]">
        <AnimatePresence mode="wait">
          {view === 'stats' ? (
            <StatsView key="stats" />
          ) : view === 'projects' ? (
            <ProjectView key="projects" />
          ) : view === 'folders' ? (
            <FolderView key="folders" />
          ) : view === 'languages' ? (
            <LanguageView key="languages" />
          ) : view === 'workspace' ? (
            <WorkspaceView key="workspace" />
          ) : view === 'glossary' ? (
            <GlossaryView key="glossary" />
          ) : view === 'board' ? (
            <BoardView key="board" />
          ) : view === 'challenges' ? (
            <ChallengesView key="challenges" />
          ) : view === 'trash' ? (
            <TrashView key="trash" />
          ) : view === 'settings' ? (
            <Settings key="settings" />
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 bg-zinc-50 dark:bg-zinc-900 rounded-2xl animate-pulse border border-zinc-100 dark:border-zinc-800" />
                  ))}
                </div>
              ) : snippets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                    <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">No snippets found</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
                    {filter.search || filter.tag || filter.favorite || filter.learning_status || filter.collection_id
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Start building your library by creating your first snippet."}
                  </p>
                  <button 
                    onClick={() => setIsEditorOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Snippet
                  </button>
                </div>
              ) : (
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 pb-20",
                  settings.compactMode ? "gap-4" : "gap-8"
                )}>
                  {snippets.map((snippet) => (
                    <SnippetCard 
                      key={snippet.id} 
                      snippet={snippet} 
                      onEdit={handleEdit} 
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SnippetEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        initialData={editingSnippet} 
      />

      {/* Global Search Modal */}
      <AnimatePresence>
        {isGlobalSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-zinc-950/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <Search className="w-5 h-5 text-zinc-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search everything in your vault..." 
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <button onClick={() => setIsGlobalSearchOpen(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <CloseIcon className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {isSearching ? (
                  <div className="p-8 text-center text-zinc-400">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Searching...
                  </div>
                ) : globalSearchQuery ? (
                  <div className="space-y-4 p-2">
                    {/* Snippets */}
                    {globalSearchResults.snippets.length > 0 && (
                      <div>
                        <h4 className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Snippets</h4>
                        <div className="space-y-1">
                          {globalSearchResults.snippets.map((s: any) => (
                            <button 
                              key={s.id}
                              onClick={() => handleGlobalSearchSelect(s)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left group"
                            >
                              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <CodeIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{s.name}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">{s.language}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    {globalSearchResults.files.length > 0 && (
                      <div>
                        <h4 className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Workspace Files</h4>
                        <div className="space-y-1">
                          {globalSearchResults.files.map((f: any) => (
                            <button 
                              key={f.id}
                              onClick={() => handleGlobalSearchSelect(f)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left group"
                            >
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <FileCode className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{f.name}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">{f.language}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Definitions */}
                    {globalSearchResults.definitions.length > 0 && (
                      <div>
                        <h4 className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Glossary Terms</h4>
                        <div className="space-y-1">
                          {globalSearchResults.definitions.map((d: any) => (
                            <button 
                              key={d.id}
                              onClick={() => handleGlobalSearchSelect(d)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left group"
                            >
                              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{d.name}</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">{d.language}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {globalSearchResults.snippets.length === 0 && 
                     globalSearchResults.files.length === 0 && 
                     globalSearchResults.definitions.length === 0 && (
                      <div className="p-12 text-center text-zinc-400">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="font-medium">No results found for "{globalSearchQuery}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-400">
                    <Command className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-medium">Type to search snippets, files, and glossary terms...</p>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold">
                        <span className="text-zinc-500">ESC</span>
                        <span className="text-zinc-400">to close</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><span className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">↑↓</span> to navigate</span>
                  <span className="flex items-center gap-1"><span className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">ENTER</span> to select</span>
                </div>
                <span>CodeVault Search</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <SnippetProvider>
        <div className="flex min-h-screen font-sans text-zinc-900 bg-white dark:bg-zinc-950">
          <Sidebar />
          <MainContent />
        </div>
      </SnippetProvider>
    </ConfirmProvider>
  );
}
