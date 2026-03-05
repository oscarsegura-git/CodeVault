import React, { useState } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { useConfirm } from '../context/ConfirmContext';
import { Trash2, RotateCcw, Trash, AlertCircle, Search, FileCode, BookOpen, Code, Folder, FolderKanban, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function TrashView() {
  const { trash, restoreSnippet, restoreFile, restoreDefinition, restoreCollection, restoreProject, restoreWorkspaceFolder, restoreChallenge, deleteSnippet, deleteFile, deleteDefinition, deleteCollection, deleteProject, deleteWorkspaceFolder, deleteChallenge, refreshSnippets, projects, workspaceFolders } = useSnippets();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'snippets' | 'files' | 'definitions' | 'collections' | 'projects' | 'workspaceFolders' | 'challenges'>('snippets');
  const [searchTerm, setSearchTerm] = useState('');

  const getLocation = (item: any) => {
    if (activeTab === 'snippets' && item.project_id) {
      const project = projects.find(p => p.id === item.project_id) || trash.projects.find(p => p.id === item.project_id);
      return project ? `Project: ${project.name}` : 'Unknown Project';
    }
    if (activeTab === 'files' && item.folder_id) {
      const folder = workspaceFolders.find(f => f.id === item.folder_id) || trash.workspaceFolders.find(f => f.id === item.folder_id);
      return folder ? `Folder: ${folder.name}` : 'Unknown Folder';
    }
    return null;
  };

  const handleRestore = async (id: string, type: string) => {
    if (type === 'snippets') await restoreSnippet(id);
    else if (type === 'files') await restoreFile(id);
    else if (type === 'definitions') await restoreDefinition(id);
    else if (type === 'collections') await restoreCollection(id);
    else if (type === 'projects') await restoreProject(id);
    else if (type === 'workspaceFolders') await restoreWorkspaceFolder(id);
    else if (type === 'challenges') await restoreChallenge(id);
    alert('Item restored successfully!');
  };

  const handlePermanentDelete = async (id: string, type: string) => {
    const confirmed = await confirm({
      title: 'Delete Permanently',
      message: 'Are you sure you want to permanently delete this item? This action cannot be undone.',
      isDestructive: true,
      confirmText: 'Delete Forever'
    });
    if (confirmed) {
      if (type === 'snippets') await deleteSnippet(id, true);
      else if (type === 'files') await deleteFile(id, true);
      else if (type === 'definitions') await deleteDefinition(id, true);
      else if (type === 'collections') await deleteCollection(id, true);
      else if (type === 'projects') await deleteProject(id, true);
      else if (type === 'workspaceFolders') await deleteWorkspaceFolder(id, true);
      else if (type === 'challenges') await deleteChallenge(id, true);
    }
  };

  const emptyTrash = async () => {
    const confirmed = await confirm({
      title: 'Empty Trash',
      message: `Are you sure you want to empty the ${activeTab} trash? All items will be permanently deleted.`,
      isDestructive: true,
      confirmText: 'Empty Trash'
    });
    if (confirmed) {
      const items = trash[activeTab];
      for (const item of items) {
        if (activeTab === 'snippets') await deleteSnippet(item.id, true);
        else if (activeTab === 'files') await deleteFile(item.id, true);
        else if (activeTab === 'definitions') await deleteDefinition(item.id, true);
        else if (activeTab === 'collections') await deleteCollection(item.id, true);
        else if (activeTab === 'projects') await deleteProject(item.id, true);
        else if (activeTab === 'workspaceFolders') await deleteWorkspaceFolder(item.id, true);
        else if (activeTab === 'challenges') await deleteChallenge(item.id, true);
      }
      alert('Category trash emptied!');
    }
  };

  const emptyAllTrash = async () => {
    const confirmed = await confirm({
      title: 'Empty All Trash',
      message: 'Are you sure you want to empty ALL trash categories? This action is irreversible.',
      isDestructive: true,
      confirmText: 'Empty All'
    });
    if (confirmed) {
      // Snippets
      for (const item of trash.snippets) await deleteSnippet(item.id, true);
      // Files
      for (const item of trash.files) await deleteFile(item.id, true);
      // Definitions
      for (const item of trash.definitions) await deleteDefinition(item.id, true);
      // Collections
      for (const item of trash.collections) await deleteCollection(item.id, true);
      // Projects
      for (const item of trash.projects) await deleteProject(item.id, true);
      // Workspace Folders
      for (const item of trash.workspaceFolders) await deleteWorkspaceFolder(item.id, true);
      // Challenges
      for (const item of trash.challenges) await deleteChallenge(item.id, true);
      alert('All trash emptied!');
    }
  };

  const restoreAll = async () => {
    const confirmed = await confirm({
      title: 'Restore All',
      message: `Are you sure you want to restore all ${activeTab}?`,
      confirmText: 'Restore'
    });
    if (confirmed) {
      const items = trash[activeTab];
      for (const item of items) {
        if (activeTab === 'snippets') await restoreSnippet(item.id);
        else if (activeTab === 'files') await restoreFile(item.id);
        else if (activeTab === 'definitions') await restoreDefinition(item.id);
        else if (activeTab === 'collections') await restoreCollection(item.id);
        else if (activeTab === 'projects') await restoreProject(item.id);
        else if (activeTab === 'workspaceFolders') await restoreWorkspaceFolder(item.id);
        else if (activeTab === 'challenges') await restoreChallenge(item.id);
      }
      alert(`All ${activeTab} restored!`);
    }
  };

  const items = trash[activeTab].filter(item => {
    const title = (item as any).title || (item as any).name || (item as any).term || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-500" />
            Trash Bin
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage deleted items. You can restore them or delete them permanently.</p>
        </div>
        <div className="flex gap-3">
          {items.length > 0 && (
            <button 
              onClick={restoreAll}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-100 dark:border-indigo-800"
            >
              <RotateCcw className="w-4 h-4" />
              Restore All
            </button>
          )}
          {(trash.snippets.length > 0 || trash.files.length > 0 || trash.definitions.length > 0) && (
            <button 
              onClick={emptyAllTrash}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-800"
            >
              <Trash className="w-4 h-4" />
              Empty All Trash
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('snippets')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'snippets' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Code className="w-4 h-4" />
            Snippets ({trash.snippets.length})
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'files' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <FileCode className="w-4 h-4" />
            Files ({trash.files.length})
          </button>
          <button 
            onClick={() => setActiveTab('definitions')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'definitions' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Glossary ({trash.definitions.length})
          </button>
          <button 
            onClick={() => setActiveTab('collections')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'collections' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Folder className="w-4 h-4" />
            Collections ({trash.collections.length})
          </button>
          <button 
            onClick={() => setActiveTab('workspaceFolders')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'workspaceFolders' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Folder className="w-4 h-4" />
            Folders ({trash.workspaceFolders.length})
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'projects' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <FolderKanban className="w-4 h-4" />
            Projects ({trash.projects.length})
          </button>
          <button 
            onClick={() => setActiveTab('challenges')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'challenges' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Trophy className="w-4 h-4" />
            Challenges ({trash.challenges.length})
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder={`Search deleted ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 truncate">
                      {(item as any).title || (item as any).name || (item as any).term}
                    </h3>
                    {getLocation(item) && (
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-medium">
                        {getLocation(item)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Deleted on {new Date((item as any).deleted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRestore(item.id, activeTab)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-indigo-600 transition-colors"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(item.id, activeTab)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-zinc-500 hover:text-red-600 transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 font-mono">
                  {(item as any).code || (item as any).content || (item as any).definition || (item as any).description || 'No content'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Trash2 className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-lg font-medium">Trash is empty</p>
          <p className="text-sm">Items you delete will appear here.</p>
        </div>
      )}
    </div>
  );
}
