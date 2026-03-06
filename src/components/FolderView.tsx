import React, { useState } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { useConfirm } from '../context/ConfirmContext';
import { Folder, Plus, Trash2, Edit3, ChevronRight, Code, ArrowLeft, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import SnippetCard from './SnippetCard';

export default function FolderView() {
  const { collections, addCollection, deleteCollection, updateCollection, snippets, updateSnippet } = useSnippets();
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSelectingSnippet, setIsSelectingSnippet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      await addCollection(newName.trim(), newDescription.trim());
      setNewName('');
      setNewDescription('');
      setIsAdding(false);
    }
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFolderId && editFolderName.trim()) {
      await updateCollection(selectedFolderId, editFolderName.trim(), editFolderDescription.trim());
      setIsEditingFolder(false);
    }
  };

  const startEditFolder = (folder: any) => {
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setIsEditingFolder(true);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Folder',
      message: 'Are you sure you want to delete this folder? Snippets will be preserved but unlinked.',
      isDestructive: true,
      confirmText: 'Delete'
    });
    if (confirmed) {
      await deleteCollection(id);
    }
  };

  const handleAddSnippetToFolder = async (snippetId: string) => {
    if (selectedFolderId) {
      const snippet = snippets.find(s => s.id === snippetId);
      if (snippet) {
        await updateSnippet(snippetId, { ...snippet, collection_id: selectedFolderId });
        setIsSelectingSnippet(false);
        setSearchTerm('');
      }
    }
  };

  const handleRemoveSnippetFromFolder = async (e: React.MouseEvent, snippetId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent opening editor
    const confirmed = await confirm({
      title: 'Remove Snippet',
      message: 'Remove snippet from this folder?',
      isDestructive: true,
      confirmText: 'Remove'
    });
    if (confirmed) {
      const snippet = snippets.find(s => s.id === snippetId);
      if (snippet) {
        await updateSnippet(snippetId, { ...snippet, collection_id: null });
      }
    }
  };

  const folderSnippets = snippets.filter(s => s.collection_id === selectedFolderId);
  const selectedFolder = collections.find(c => c.id === selectedFolderId);
  
  // Snippets available to add (not in this folder)
  const availableSnippets = snippets.filter(s => 
    s.collection_id !== selectedFolderId && 
    (s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedFolderId && selectedFolder) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8 h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSelectedFolderId(null)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              {isEditingFolder ? (
                <form onSubmit={handleUpdateFolder} className="flex flex-col gap-2 max-w-md">
                  <input
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 outline-none px-1"
                    autoFocus
                  />
                  <input
                    value={editFolderDescription}
                    onChange={(e) => setEditFolderDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="text-sm text-zinc-500 bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 outline-none px-1"
                  />
                  <div className="flex gap-2 mt-1">
                    <button type="submit" className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">Save</button>
                    <button type="button" onClick={() => setIsEditingFolder(false)} className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="group flex items-start gap-2">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {selectedFolder.name}
                      <button 
                        onClick={() => startEditFolder(selectedFolder)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-indigo-500 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </h2>
                    <p className="text-sm text-zinc-500">{selectedFolder.description || 'No description provided.'}</p>
                    <p className="text-xs text-zinc-400 mt-1">{folderSnippets.length} snippets</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsSelectingSnippet(true)}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Snippet
          </button>
        </div>

        {/* Add Snippet Modal/Overlay */}
        <AnimatePresence>
          {isSelectingSnippet && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setIsSelectingSnippet(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Snippet to Folder</h3>
                  <button onClick={() => setIsSelectingSnippet(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search snippets..."
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {availableSnippets.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <p>No matching snippets found.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableSnippets.map(snippet => (
                        <button
                          key={snippet.id}
                          onClick={() => handleAddSnippetToFolder(snippet.id)}
                          className="w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                              <Code className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{snippet.title}</h4>
                              <p className="text-xs text-zinc-500 truncate">{snippet.language}</p>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">Add</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {folderSnippets.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                <Code className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No snippets in this folder yet.</p>
                <button 
                  onClick={() => setIsSelectingSnippet(true)}
                  className="mt-4 text-sm font-bold text-indigo-600 hover:underline"
                >
                  Add existing snippets
                </button>
              </div>
            ) : (
              folderSnippets.map(snippet => (
                <div key={snippet.id} className="relative group">
                  <SnippetCard snippet={snippet} />
                  <button 
                    onClick={(e) => handleRemoveSnippetFromFolder(e, snippet.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                    title="Remove from folder"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Folders</h2>
          <p className="text-zinc-500 text-sm">Organize your snippets into collections.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Folder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4"
            >
              <form onSubmit={handleAdd} className="w-full space-y-4">
                <input 
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                />
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter description (optional)..."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20 resize-none h-20"
                />
                <div className="flex items-center gap-2 w-full">
                  <button 
                    type="submit"
                    className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 rounded-xl font-medium text-sm"
                  >
                    Create
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-zinc-500 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {collections.map(folder => (
          <motion.div 
            key={folder.id}
            layout
            onClick={() => setSelectedFolderId(folder.id)}
            className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                <Folder className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => handleDeleteFolder(e, folder.id)}
                className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                title="Delete folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">{folder.name}</h3>
            <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{folder.description || 'No description provided.'}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {folder.snippet_count} Snippets
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
