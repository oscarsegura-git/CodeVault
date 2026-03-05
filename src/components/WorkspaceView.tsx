import React, { useState, useEffect, useRef } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { File, Save, Trash2, Plus, Code, Scissors, X, Check, MoreVertical, FolderOpen, Download, Clock, Edit2, Play, Terminal, Maximize2, Minimize2, FileCode, Folder, ChevronRight, ChevronDown, FolderPlus, FilePlus, FileText, FileJson, FileImage, FileSpreadsheet, Search, Book, ChevronsDown, ChevronsUp, Copy, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from 'react-simple-code-editor';
import Prism, { getPrismLang } from '../lib/prism-setup';
import 'prismjs/themes/prism-tomorrow.css';
import { cn, LANGUAGES } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';
import SearchableSelect from './SearchableSelect';
import LibrarySelector from './LibrarySelector';

export default function WorkspaceView() {
  const { files, workspaceFolders, addFile, updateFile, deleteFile, addSnippet, settings, addWorkspaceFolder, deleteWorkspaceFolder, updateWorkspaceFolder } = useSnippets();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('javascript');
  const [newFolderName, setNewFolderName] = useState('');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  // Editor state
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileLang, setFileLang] = useState('javascript');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Selection for snippet creation
  const [selection, setSelection] = useState('');
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetLanguage, setSnippetLanguage] = useState('');
  const [snippetTags, setSnippetTags] = useState<string[]>([]);
  const [snippetLibraries, setSnippetLibraries] = useState<string[]>([]);
  const [snippetTagInput, setSnippetTagInput] = useState('');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [renamingType, setRenamingType] = useState<'file' | 'folder'>('file');

  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ type: 'file' | 'folder', id: string } | null>(null);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, type: 'file' | 'folder', id: string) => {
    e.stopPropagation();
    setDraggedItem({ type, id });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  // Helper to check if target is a child of source
  const isChildFolder = (parentId: string, childId: string) => {
    let current = workspaceFolders.find(f => f.id === childId);
    while (current) {
      if (current.parent_id === parentId) return true;
      current = workspaceFolders.find(f => f.id === current?.parent_id);
    }
    return false;
  };



  const editorRef = useRef<HTMLDivElement>(null);
  const prevFileIdRef = useRef<string | null>(null);
  
  // Store unsaved content for each file: { [fileId]: content }
  const unsavedBuffers = useRef<Record<string, string>>({});

  useEffect(() => {
    if (selectedFileId !== prevFileIdRef.current) {
      // Save current content to buffer if we are switching AWAY from a file
      if (prevFileIdRef.current && unsavedChanges) {
        unsavedBuffers.current[prevFileIdRef.current] = content;
      }

      // File switched
      prevFileIdRef.current = selectedFileId;
      
      if (selectedFileId) {
        // Check if we have an unsaved buffer for this file
        if (unsavedBuffers.current[selectedFileId] !== undefined) {
          const file = files.find(f => f.id === selectedFileId);
          setContent(unsavedBuffers.current[selectedFileId]);
          setFileName(file?.name || '');
          setFileLang(file?.language || 'javascript');
          setUnsavedChanges(true);
        } else {
          // No buffer, load from file
          const file = files.find(f => f.id === selectedFileId);
          if (file) {
            setContent(file.content || '');
            setFileName(file.name);
            setFileLang(file.language);
            setUnsavedChanges(false);
          }
        }
      } else {
        setContent('');
        setFileName('');
        setUnsavedChanges(false);
      }
    } else {
      // File ID is same, but files array might have changed (e.g. background sync)
      // Only sync from server if we don't have unsaved changes AND we don't have a buffer
      if (selectedFileId && !unsavedChanges && unsavedBuffers.current[selectedFileId] === undefined) {
         const file = files.find(f => f.id === selectedFileId);
         if (file) {
           // Only update if content is actually different to avoid cursor jumps or re-renders
           if (file.content !== content) setContent(file.content || '');
           if (file.name !== fileName) setFileName(file.name);
           if (file.language !== fileLang) setFileLang(file.language);
         }
      }
    }
  }, [selectedFileId, files, content, fileName, fileLang, unsavedChanges]);

  // Fix for default text disappearing on click/focus
  const handleEditorFocus = () => {
    if (content === '// Start coding here...') {
      setContent('');
    }
  };

  useEffect(() => {
    if (settings.autoSave && unsavedChanges && selectedFileId) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, fileName, fileLang, settings.autoSave, unsavedChanges, selectedFileId]);

  useEffect(() => {
    const handleGlobalSave = () => {
      if (selectedFileId && unsavedChanges) {
        handleSave();
      }
    };
    window.addEventListener('global-save', handleGlobalSave);
    return () => window.removeEventListener('global-save', handleGlobalSave);
  }, [selectedFileId, unsavedChanges, content, fileName, fileLang]);

  const handleSave = async () => {
    if (!selectedFileId) return;
    const currentContent = content;
    const currentName = fileName;
    const currentLang = fileLang;
    
    setUnsavedChanges(false);
    
    await updateFile(selectedFileId, {
      name: currentName,
      content: currentContent,
      language: currentLang
    });
    
    // Clear buffer for this file
    delete unsavedBuffers.current[selectedFileId];
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;

    const { type, id } = draggedItem;

    try {
      if (type === 'file') {
        const file = files.find(f => f.id === id);
        if (file && file.folder_id !== targetFolderId) {
          await updateFile(id, { folder_id: targetFolderId });
        }
      } else if (type === 'folder') {
        if (id === targetFolderId) return; // Prevent self-drop
        
        // Check for circular dependency
        if (targetFolderId && isChildFolder(id, targetFolderId)) {
          alert("Cannot move a folder into its own child.");
          setDraggedItem(null);
          return;
        }

        const folder = workspaceFolders.find(f => f.id === id);
        if (folder && folder.parent_id !== targetFolderId) {
          await updateWorkspaceFolder(id, { parent_id: targetFolderId });
        }
      }
    } catch (error) {
      console.error("Failed to move item:", error);
    }
    
    setDraggedItem(null);
  };

  const handleCreateFile = async () => {
    if (!newFileName) return;
    await addFile({
      name: newFileName,
      content: '', // Start empty as requested
      language: newFileLang,
      folder_id: targetFolderId
    });
    setIsCreating(false);
    setNewFileName('');
    setTargetFolderId(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    await addWorkspaceFolder(newFolderName, targetFolderId || undefined);
    setIsCreatingFolder(false);
    setNewFolderName('');
    setTargetFolderId(null);
  };

  const handleDeleteFile = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete File',
      message: 'Are you sure you want to delete this file?',
      isDestructive: true,
      onConfirm: async () => {
        await deleteFile(id);
        if (selectedFileId === id) setSelectedFileId(null);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteFolder = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Folder',
      message: 'Are you sure you want to delete this folder? All contents will be moved to trash.',
      isDestructive: true,
      onConfirm: async () => {
        await deleteWorkspaceFolder(id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleStartRename = (item: any, type: 'file' | 'folder') => {
    setRenamingId(item.id);
    setRenamingName(item.name);
    setRenamingType(type);
  };

  const handleConfirmRename = async (id: string) => {
    if (!renamingName.trim()) return;
    if (renamingType === 'file') {
      await updateFile(id, { name: renamingName });
      if (selectedFileId === id) setFileName(renamingName);
    } else {
      await updateWorkspaceFolder(id, { name: renamingName });
    }
    setRenamingId(null);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleSelectionChange();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [selectedFileId]);

  const handleSelectionChange = () => {
    if (editorRef.current) {
      const textarea = editorRef.current.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== end) {
          setSelection(textarea.value.substring(start, end));
        } else {
          setSelection('');
        }
      }
    }
  };

  const openSnippetModal = () => {
    if (selection) {
      setSnippetTitle(`Snippet from ${fileName}`);
      setSnippetLanguage(fileLang);
      setSnippetTags(['workspace', fileLang]);
      setShowSnippetModal(true);
    }
  };

  const saveSnippet = async () => {
    if (!snippetTitle) return;
    await addSnippet({
      title: snippetTitle,
      code: selection,
      language: snippetLanguage,
      description: `Extracted from ${fileName} in Workspace`,
      tags: snippetTags,
      complexity: 'Intermediate',
      learning_status: 'Reference'
    });
    setShowSnippetModal(false);
    setSelection('');
    // Clear selection in editor visually if possible (hard with simple editor)
    alert('Snippet saved successfully!');
  };

  const handleCopyContent = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    alert('File content copied to clipboard!');
  };

  const handleFormat = () => {
    if (!content) return;
    try {
      if (fileLang === 'json') {
        const parsed = JSON.parse(content);
        setContent(JSON.stringify(parsed, null, 2));
        setUnsavedChanges(true);
      } else {
        // Basic indentation for other languages
        const lines = content.split('\n');
        let indentLevel = 0;
        const formatted = lines.map(line => {
          let trimmed = line.trim();
          if (trimmed.match(/^[\}\]\)]/)) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          const currentIndent = '  '.repeat(indentLevel);
          if (trimmed.match(/[\{\[\(]$/)) {
            indentLevel++;
          }
          return currentIndent + trimmed;
        }).join('\n');
        setContent(formatted);
        setUnsavedChanges(true);
      }
    } catch (e) {
      alert('Could not format code. Make sure it is valid syntax.');
    }
  };

  const handleDownload = () => {
    if (!selectedFileId) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    if (!content) return;
    setIsTerminalOpen(true);
    setTerminalOutput(['> Running ' + fileName + '...']);
    
    if (fileLang.toLowerCase() === 'javascript' || fileLang.toLowerCase() === 'typescript') {
      try {
        // Capture console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const logs: string[] = [];
        
        const formatArg = (a: any) => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
        
        console.log = (...args) => {
          logs.push(`[LOG] ${args.map(formatArg).join(' ')}`);
        };
        console.error = (...args) => {
          logs.push(`[ERROR] ${args.map(formatArg).join(' ')}`);
        };
        console.warn = (...args) => {
          logs.push(`[WARN] ${args.map(formatArg).join(' ')}`);
        };
        
        // Execute code safely
        const result = new Function(content)();
        
        // Restore console methods
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        
        setTerminalOutput(prev => [
          ...prev, 
          ...logs, 
          ...(result !== undefined ? [`> Returned: ${formatArg(result)}`] : []),
          '> Execution finished successfully.'
        ]);
      } catch (error: any) {
        setTerminalOutput(prev => [...prev, `> Runtime Error: ${error.message}`]);
      }
    } else {
      setTerminalOutput(prev => [
        ...prev, 
        `> Simulated execution of ${fileLang} code.`,
        `> (Actual execution is only supported for JavaScript in this environment)`
      ]);
    }
  };

  const addSnippetTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && snippetTagInput.trim()) {
      if (!snippetTags.includes(snippetTagInput.trim())) {
        setSnippetTags([...snippetTags, snippetTagInput.trim()]);
      }
      setSnippetTagInput('');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'json') return <FileJson className="w-4 h-4 text-amber-500" />;
    if (ext === 'md' || ext === 'txt') return <FileText className="w-4 h-4 text-zinc-500" />;
    if (ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'svg') return <FileImage className="w-4 h-4 text-purple-500" />;
    return <FileCode className="w-4 h-4 text-indigo-500" />;
  };

  const renderFileSystem = (parentId: string | null = null, depth = 0) => {
    const currentFolders = workspaceFolders.filter(f => (f.parent_id || null) === parentId);
    const currentFiles = files.filter(f => (f.folder_id || null) === parentId);

    return (
      <div className="space-y-0.5">
        {currentFolders.map(folder => (
          <div key={folder.id} className="select-none">
            <div 
              className={cn(
                "group flex items-center justify-between px-2 py-1 rounded-lg text-xs cursor-pointer transition-all select-none",
                "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border border-transparent"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(folder.id)}
              onDoubleClick={(e) => { e.stopPropagation(); handleStartRename(folder, 'folder'); }}
              draggable
              onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              <div className="flex items-center gap-1.5 truncate flex-1">
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                )}
                <Folder className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                {renamingId === folder.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={renamingName}
                    onChange={e => setRenamingName(e.target.value)}
                    onBlur={() => handleConfirmRename(folder.id)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmRename(folder.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-indigo-500 rounded px-1 outline-none text-xs"
                  />
                ) : (
                  <span className="truncate font-medium">{folder.name}</span>
                )}
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setTargetFolderId(folder.id); setIsCreating(true); }}
                  className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-500"
                  title="New File"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setTargetFolderId(folder.id); setIsCreatingFolder(true); }}
                  className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-500"
                  title="New Folder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500 rounded"
                  title="Delete Folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {expandedFolders.has(folder.id) && (
              <div>
                {renderFileSystem(folder.id, depth + 1)}
              </div>
            )}
          </div>
        ))}

        {currentFiles.map(file => (
          <div 
            key={file.id}
            onClick={() => setSelectedFileId(file.id)}
            onDoubleClick={(e) => { e.stopPropagation(); handleStartRename(file, 'file'); }}
            className={cn(
              "group flex items-center justify-between px-1.5 py-0.5 rounded-lg text-xs cursor-pointer transition-all select-none",
              selectedFileId === file.id 
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700 font-medium" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border border-transparent"
            )}
            style={{ paddingLeft: `${depth * 10 + 16}px` }}
            draggable
            onDragStart={(e) => handleDragStart(e, 'file', file.id)}
          >
            <div className="flex items-center gap-1.5 truncate flex-1">
              {getFileIcon(file.name)}
              {renamingId === file.id ? (
                <input
                  autoFocus
                  type="text"
                  value={renamingName}
                  onChange={e => setRenamingName(e.target.value)}
                  onBlur={() => handleConfirmRename(file.id)}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmRename(file.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-zinc-100 dark:bg-zinc-950 border border-indigo-500 rounded px-1 outline-none text-xs"
                />
              ) : (
                <div className="flex items-center gap-1.5 truncate w-full">
                  <span className="truncate">{file.name}</span>
                  <span className="text-[9px] opacity-50 uppercase tracking-wider font-mono shrink-0">{file.language}</span>
                </div>
              )}
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleStartRename(file, 'file'); }}
                className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-500"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500 rounded"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const expandAllFolders = () => {
    setExpandedFolders(new Set(workspaceFolders.map(f => f.id)));
  };

  const collapseAllFolders = () => {
    setExpandedFolders(new Set());
  };

  return (
    <div className={cn(
      "flex bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-300",
      isFullscreen ? "fixed inset-0 z-50" : "h-[calc(100vh-73px)]"
    )}>
      {/* Sidebar */}
      {!isFullscreen && (
        <div className="w-72 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 backdrop-blur-xl shrink-0">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight text-sm uppercase">
              <FolderOpen className="w-4 h-4 text-indigo-500" />
              Workspace
            </h2>
            <div className="flex gap-1">
              <button 
                onClick={expandAllFolders} 
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" 
                title="Expand All"
              >
                <ChevronsDown className="w-4 h-4" />
              </button>
              <button 
                onClick={collapseAllFolders} 
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" 
                title="Collapse All"
              >
                <ChevronsUp className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1 self-center" />
              <button 
                onClick={() => setIsCreatingFolder(true)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="New Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsCreating(true)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="New File"
              >
                <FilePlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="bg-transparent border-none outline-none text-xs w-full text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" />
                </button>
              )}
            </div>
          </div>

        <AnimatePresence>
          {isCreatingFolder && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <input
                autoFocus
                type="text"
                placeholder="Folder Name..."
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 mb-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleCreateFolder}
                  className="flex-1 bg-indigo-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
                <button 
                  onClick={() => setIsCreatingFolder(false)}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
          {isCreating && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <input
                autoFocus
                type="text"
                placeholder="Filename..."
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 mb-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
              />
              <SearchableSelect
                options={LANGUAGES.map(lang => ({ value: lang.toLowerCase(), label: lang }))}
                value={newFileLang}
                onChange={(val) => setNewFileLang(val as string)}
                placeholder="Select Language"
                className="mb-2"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleCreateFile}
                  className="flex-1 bg-indigo-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className="flex-1 overflow-y-auto p-2 space-y-1"
          onDragOver={(e) => handleDragOver(e, null)}
          onDrop={(e) => handleDrop(e, null)}
        >
          {files.length === 0 && workspaceFolders.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-zinc-400">No files yet. Create one to start coding.</p>
            </div>
          ) : (
            searchQuery ? (
              <div className="space-y-0.5">
                {files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(file => (
                  <div 
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={cn(
                      "group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all select-none ml-2",
                      selectedFileId === file.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <FileCode className={cn("w-3.5 h-3.5 shrink-0", selectedFileId === file.id ? "text-indigo-500" : "text-zinc-400")} />
                      <span className="truncate">{file.name}</span>
                      <span className="text-[10px] text-zinc-400 ml-auto">{file.language}</span>
                    </div>
                  </div>
                ))}
                {files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center py-4 text-xs text-zinc-400">No matching files found</div>
                )}
              </div>
            ) : (
              renderFileSystem()
            )
          )}
        </div>
      </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1117]">
        {selectedFileId ? (
          <>
            <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-zinc-50 dark:bg-[#010409]">
              <div className="flex items-center gap-2 h-full">
                <div className="flex items-center gap-2 px-4 h-full bg-white dark:bg-[#0d1117] border-t-2 border-t-indigo-500 border-r border-r-zinc-200 dark:border-r-zinc-800 border-l border-l-zinc-200 dark:border-l-zinc-800 -mb-px">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => { setFileName(e.target.value); setUnsavedChanges(true); }}
                    className="bg-transparent font-medium text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none w-32"
                  />
                  {unsavedChanges && (
                    <div className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                  )}
                </div>
                <select
                  value={fileLang}
                  onChange={(e) => { setFileLang(e.target.value); setUnsavedChanges(true); }}
                  className="text-xs font-medium bg-transparent border-none rounded-lg px-2 py-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 outline-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isTerminalOpen ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                  title="Toggle Terminal"
                >
                  <Terminal className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800"
                  title="Run Code"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run
                </button>
                <button
                  onClick={handleFormat}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                  title="Format Code"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyContent}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                  title="Copy File Content"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {selection && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={openSnippetModal}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      Save Selection
                    </motion.button>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-900/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save File
                </button>
              </div>
            </div>
            
            <div 
              className="flex-1 overflow-hidden flex flex-col relative bg-white dark:bg-[#0d1117]" 
              onMouseUp={handleSelectionChange} 
              onKeyUp={handleSelectionChange} 
              onSelect={handleSelectionChange}
              ref={editorRef}
            >
              <div className="flex-1 overflow-auto prism-editor custom-scrollbar">
                <Editor
                  key={settings.fontSize}
                  value={content}
                  onValueChange={(code) => { 
                    setContent(code); 
                    setUnsavedChanges(true); 
                  }}
                  highlight={code => {
                    const lang = getPrismLang(fileLang);
                    return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                  }}
                  padding={24}
                  className="font-mono min-h-full"
                  textareaClassName="focus:outline-none"
                  style={{
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: settings.fontSize || '14px',
                    backgroundColor: 'transparent',
                    minHeight: '100%',
                    lineHeight: '1.6',
                  }}
                />
              </div>
              
              {/* Editor Status Bar */}
              <div className="h-6 bg-zinc-100 dark:bg-[#010409] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 text-[10px] font-mono text-zinc-500 select-none">
                <div className="flex items-center gap-4">
                  <span>Ln {content.substring(0, (editorRef.current?.querySelector('textarea')?.selectionStart || 0)).split('\n').length}, Col {(editorRef.current?.querySelector('textarea')?.selectionStart || 0) - content.lastIndexOf('\n', (editorRef.current?.querySelector('textarea')?.selectionStart || 0) - 1)}</span>
                  <span>{content.length} chars</span>
                  <span>{content.split('\n').length} lines</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>UTF-8</span>
                  <span>{fileLang}</span>
                </div>
              </div>

              {/* Terminal Pane */}
              <AnimatePresence>
                {isTerminalOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 250, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-300 flex flex-col shrink-0"
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <Terminal className="w-3.5 h-3.5" />
                        Console Output
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setTerminalOutput([])}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(terminalOutput.join('\n'));
                            alert('Output copied to clipboard');
                          }}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Copy
                        </button>
                        <button 
                          onClick={() => setIsTerminalOpen(false)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed flex flex-col bg-zinc-950 text-zinc-300">
                      <div className="flex-1 space-y-1">
                        {terminalOutput.length === 0 ? (
                          <div className="text-zinc-600 italic p-2">
                            // Console ready. Type JavaScript to evaluate.
                            <br />
                            // Example: 2 + 2 or console.log("Hello")
                          </div>
                        ) : (
                          terminalOutput.map((line, i) => {
                            let className = "break-words whitespace-pre-wrap font-mono";
                            let content = line;

                            if (line.startsWith('> Error:') || line.startsWith('[ERROR]')) {
                              className += " text-red-400 bg-red-900/10 p-1 rounded border-l-2 border-red-500 pl-2";
                              content = line.replace('[ERROR] ', '');
                            } else if (line.startsWith('[WARN]')) {
                              className += " text-amber-400 bg-amber-900/10 p-1 rounded border-l-2 border-amber-500 pl-2";
                              content = line.replace('[WARN] ', '');
                            } else if (line.startsWith('[LOG]')) {
                              className += " text-zinc-300 pl-4 border-l-2 border-zinc-700";
                              content = line.replace('[LOG] ', '');
                            } else if (line.startsWith('> ')) {
                              className += " text-zinc-500 mt-2 font-bold";
                            } else {
                              className += " text-zinc-300 pl-4 border-l-2 border-zinc-800";
                            }

                            return (
                              <div key={i} className={className}>
                                {content}
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800">
                        <span className="text-indigo-500 font-bold animate-pulse">{'>'}</span>
                        <input 
                          type="text" 
                          className="flex-1 bg-transparent outline-none text-zinc-100 font-mono text-xs placeholder:text-zinc-700" 
                          placeholder="Execute JavaScript..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const cmd = e.currentTarget.value;
                              if (!cmd.trim()) return;
                              setTerminalOutput(prev => [...prev, `> ${cmd}`]);
                              
                              const originalLog = console.log;
                              const logs: string[] = [];
                              console.log = (...args) => {
                                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
                              };

                              try {
                                const result = new Function(`return ${cmd}`)();
                                console.log = originalLog;
                                if (logs.length > 0) {
                                  setTerminalOutput(prev => [...prev, ...logs]);
                                }
                                if (result !== undefined) {
                                  setTerminalOutput(prev => [...prev, typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)]);
                                }
                              } catch (err: any) {
                                try {
                                  const result = new Function(cmd)();
                                  console.log = originalLog;
                                  if (logs.length > 0) {
                                    setTerminalOutput(prev => [...prev, ...logs]);
                                  }
                                  if (result !== undefined) {
                                    setTerminalOutput(prev => [...prev, typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)]);
                                  }
                                } catch (err2: any) {
                                  console.log = originalLog;
                                  setTerminalOutput(prev => [...prev, ...logs, `> Error: ${err2.message}`]);
                                }
                              }
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
              <File className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No File Selected</h3>
            <p className="max-w-xs text-center text-sm">Select a file from the sidebar or create a new one to start coding in the workspace.</p>
          </div>
        )}
      </div>

      {/* Snippet Creation Modal */}
      <AnimatePresence>
        {showSnippetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
                <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100">Save Selection as Snippet</h3>
                <button onClick={() => setShowSnippetModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Snippet Title</label>
                  <input 
                    type="text" 
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    placeholder="e.g. Helper Function"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Language</label>
                  <SearchableSelect
                    options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                    value={snippetLanguage}
                    onChange={(val) => setSnippetLanguage(val as string)}
                    placeholder="Select Language"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {snippetTags.map(tag => (
                      <span key={tag} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        {tag}
                        <button onClick={() => setSnippetTags(snippetTags.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={snippetTagInput}
                    onChange={(e) => setSnippetTagInput(e.target.value)}
                    onKeyDown={addSnippetTag}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    placeholder="Add tag and press Enter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Preview Code</label>
                  <div className="max-h-32 overflow-y-auto p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{selection}</pre>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-end gap-3">
                <button 
                  onClick={() => setShowSnippetModal(false)}
                  className="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveSnippet}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Snippet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
}
