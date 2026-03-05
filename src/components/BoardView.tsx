import React, { useState, useEffect } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MoreHorizontal, Calendar, CheckCircle2, Circle, Clock, Archive, Trash2, Edit2, Code, Layout, BookOpen, Tag, GripVertical, ArrowDownUp } from 'lucide-react';
import { cn } from '../lib/utils';

const PROJECT_COLUMNS = [
  { id: 'planning', title: 'Planning', icon: Circle, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700' },
  { id: 'active', title: 'In Progress', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'archived', title: 'Archived', icon: Archive, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' }
];

const SNIPPET_COLUMNS = [
  { id: 'To Learn', title: 'To Learn', icon: Circle, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700' },
  { id: 'Learning', title: 'Learning', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'Mastered', title: 'Mastered', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'Reference', title: 'Reference', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' }
];

export default function BoardView() {
  const { projects, updateProject, deleteProject, addProject, snippets, updateSnippet, deleteSnippet } = useSnippets();
  const [boardType, setBoardType] = useState<'projects' | 'snippets'>('projects');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  // Project creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState('Medium');
  const [newProjectDeadline, setNewProjectDeadline] = useState<string>('');
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('All');
  const [search, setSearch] = useState('');

  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ columnId: string, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (columnId: string) => {
    setSortConfig(prev => {
      if (prev?.columnId === columnId) {
        return prev.direction === 'asc' ? { columnId, direction: 'desc' } : null;
      }
      return { columnId, direction: 'asc' };
    });
  };

  const getSortedItems = (items: any[], columnId: string) => {
    if (sortConfig?.columnId !== columnId) return items;
    
    return [...items].sort((a, b) => {
      // Sort by priority for projects
      if (boardType === 'projects') {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const pA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const pB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        return sortConfig.direction === 'asc' ? pA - pB : pB - pA;
      }
      // Sort by complexity for snippets
      const complexityOrder = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
      const cA = complexityOrder[a.complexity as keyof typeof complexityOrder] || 0;
      const cB = complexityOrder[b.complexity as keyof typeof complexityOrder] || 0;
      return sortConfig.direction === 'asc' ? cA - cB : cB - cA;
    });
  };

  const languages = ['All', ...Array.from(new Set(snippets.map(s => s.language))).sort()];
  
  // Filter libraries based on selected language
  const libraries = React.useMemo(() => {
    let snips = snippets;
    if (selectedLanguage !== 'All') {
      snips = snips.filter(s => s.language === selectedLanguage);
    }
    return ['All', ...Array.from(new Set(snips.flatMap(s => s.libraries || []))).sort()];
  }, [snippets, selectedLanguage]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSnippets = snippets.filter(s => 
    (selectedLanguage === 'All' || s.language === selectedLanguage) &&
    (selectedLibrary === 'All' || (s.libraries && s.libraries.includes(selectedLibrary))) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) ||
     (s.description && s.description.toLowerCase().includes(search.toLowerCase())))
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    try {
      if (status === 'trash') {
        if (boardType === 'projects') {
          await deleteProject(draggedItem);
        } else {
          await deleteSnippet(draggedItem);
        }
        return;
      }

      if (boardType === 'projects') {
        const project = projects.find(p => p.id === draggedItem);
        if (project && project.status !== status) {
          // Optimistic update
          await updateProject(project.id, project.name, project.description, status, project.libraries, project.priority, project.deadline);
        }
      } else {
        const snippet = snippets.find(s => s.id === draggedItem);
        if (snippet && snippet.learning_status !== status) {
          await updateSnippet(snippet.id, {
            ...snippet,
            learning_status: status
          });
        }
      }
    } catch (error) {
      console.error("Drop failed:", error);
    } finally {
      setDraggedItem(null);
    }
  };

  const handleQuickAdd = async (status: string) => {
    if (!quickAddText.trim()) return;
    await addProject(quickAddText, '', status, [], 'Medium', undefined);
    setQuickAddText('');
    setQuickAddColumn(null);
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    await addProject(newProjectName, newProjectDesc, 'planning', [], newProjectPriority, newProjectDeadline ? new Date(newProjectDeadline).getTime() : undefined);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectPriority('Medium');
    setNewProjectDeadline('');
    setIsCreating(false);
  };

  const handleUpdate = async (id: string, name: string, description: string, priority?: string, deadline?: number) => {
    await updateProject(id, name, description, undefined, undefined, priority, deadline);
    setEditingProject(null);
  };

  const columns = boardType === 'projects' ? PROJECT_COLUMNS : SNIPPET_COLUMNS;

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">Board</h2>
          <p className="text-zinc-500 font-medium">
            {boardType === 'projects' ? 'Manage your projects and track progress.' : 'Track your learning progress across snippets.'}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-64 group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <Layout className="w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
             </div>
             <input 
               type="text" 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
             />
          </div>

          {boardType === 'snippets' && (
            <>
              <select 
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setSelectedLibrary('All'); // Reset library when language changes
                }}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-zinc-700 dark:text-zinc-300 shadow-sm"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              <select 
                value={selectedLibrary}
                onChange={(e) => setSelectedLibrary(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-zinc-700 dark:text-zinc-300 shadow-sm max-w-[150px]"
              >
                {libraries.map(lib => (
                  <option key={lib} value={lib}>{lib}</option>
                ))}
              </select>
            </>
          )}

          <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xl flex items-center border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setBoardType('projects')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                boardType === 'projects' 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Layout className="w-3.5 h-3.5" />
              Projects
            </button>
            <button
              onClick={() => setBoardType('snippets')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                boardType === 'snippets' 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              Snippets
            </button>
          </div>

          {boardType === 'projects' && (
            <button 
              onClick={() => setIsCreating(true)}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-zinc-900/10 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCreating && boardType === 'projects' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-2xl mx-auto">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-4">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Project Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    placeholder="e.g. Website Redesign"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                  <input 
                    type="text" 
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Optional description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Priority</label>
                    <select
                      value={newProjectPriority}
                      onChange={(e) => setNewProjectPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Deadline</label>
                    <input
                      type="date"
                      value={newProjectDeadline}
                      onChange={(e) => setNewProjectDeadline(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Create Project
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 items-start min-h-0 min-w-0">
        {columns.map(column => (
          <div 
            key={column.id}
            className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={cn("p-4 rounded-t-2xl border-t border-x bg-white dark:bg-zinc-900 flex items-center justify-between", column.border)}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", column.bg)}>
                  <column.icon className={cn("w-4 h-4", column.color)} />
                </div>
                <h3 className="font-black text-zinc-700 dark:text-zinc-300 text-sm uppercase tracking-wide">{column.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSort(column.id)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    sortConfig?.columnId === column.id 
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                  )}
                  title={boardType === 'projects' ? "Sort by Priority" : "Sort by Complexity"}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-black text-zinc-500">
                  {boardType === 'projects' 
                    ? filteredProjects.filter(p => (p.status || 'active') === column.id || (column.id === 'planning' && !p.status)).length
                    : filteredSnippets.filter(s => (s.learning_status || 'Learning') === column.id).length
                  }
                </span>
              </div>
            </div>

            <div className={cn("flex-1 p-3 space-y-3 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/30 border-x custom-scrollbar", column.border, boardType !== 'projects' && "rounded-b-2xl border-b")}>
              {boardType === 'projects' ? (
                getSortedItems(
                  filteredProjects.filter(p => (p.status || 'active') === column.id || (column.id === 'planning' && !p.status)),
                  column.id
                ).map(project => (
                    <motion.div
                      layoutId={project.id}
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, project.id)}
                      className={cn(
                        "bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-md transition-all relative overflow-hidden",
                        draggedItem === project.id && "opacity-50 ring-2 ring-indigo-500/50"
                      )}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {editingProject === project.id ? (
                        <div className="space-y-3">
                          <input 
                            autoFocus
                            className="w-full text-sm font-bold bg-transparent border-b-2 border-indigo-500 outline-none py-1"
                            defaultValue={project.name}
                            id={`edit-name-${project.id}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdate(project.id, e.currentTarget.value, project.description || '', project.priority, project.deadline);
                              }
                            }}
                          />
                          <textarea 
                            className="w-full text-xs text-zinc-500 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 outline-none resize-none focus:ring-2 focus:ring-indigo-500/20"
                            defaultValue={project.description}
                            id={`edit-desc-${project.id}`}
                            rows={3}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                              }
                            }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              className="w-full text-xs text-zinc-500 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                              defaultValue={project.priority || 'Medium'}
                              id={`edit-priority-${project.id}`}
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                            <input
                              type="date"
                              className="w-full text-xs text-zinc-500 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                              defaultValue={project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''}
                              id={`edit-deadline-${project.id}`}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingProject(null)} className="text-xs font-bold text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded hover:bg-zinc-100">Cancel</button>
                            <button 
                              onClick={() => {
                                const name = (document.getElementById(`edit-name-${project.id}`) as HTMLInputElement).value;
                                const desc = (document.getElementById(`edit-desc-${project.id}`) as HTMLTextAreaElement).value;
                                const priority = (document.getElementById(`edit-priority-${project.id}`) as HTMLSelectElement).value;
                                const deadlineStr = (document.getElementById(`edit-deadline-${project.id}`) as HTMLInputElement).value;
                                handleUpdate(project.id, name, desc, priority, deadlineStr ? new Date(deadlineStr).getTime() : undefined);
                              }}
                              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">{project.name}</h4>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 -mr-2 -mt-2">
                              <button 
                                onClick={() => setEditingProject(project.id)}
                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-indigo-500 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteProject(project.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {project.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {project.priority && (
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                project.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                project.priority === 'Medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              )}>
                                {project.priority}
                              </span>
                            )}
                            {project.deadline && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(project.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          {(() => {
                            let totalTasks = 0;
                            let completedTasks = 0;
                            if (project.content) {
                              try {
                                const content = JSON.parse(project.content);
                                (content.sections || []).forEach((section: any) => {
                                  const tasks = (section.items || []).filter((i: any) => i.type === 'task');
                                  totalTasks += tasks.length;
                                  completedTasks += tasks.filter((i: any) => i.checked).length;
                                });
                              } catch (e) {}
                            }
                            
                            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                            if (totalTasks > 0) {
                              return (
                                <div className="mb-4">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Progress</span>
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{Math.round(progress)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                      style={{ width: `${progress}%` }} 
                                    />
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {project.libraries && project.libraries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {project.libraries.slice(0, 3).map((lib: string) => (
                                <span key={lib} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                                  <BookOpen className="w-2.5 h-2.5" />
                                  {lib}
                                </span>
                              ))}
                              {project.libraries.length > 3 && (
                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                                  +{project.libraries.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.updated_at).toLocaleDateString()}
                            </div>
                            {project.snippet_count > 0 && (
                              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-[10px] font-black text-zinc-500 flex items-center gap-1.5">
                                <Code className="w-3 h-3" />
                                {project.snippet_count}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))
              ) : (
                getSortedItems(
                  filteredSnippets.filter(s => (s.learning_status || 'Learning') === column.id),
                  column.id
                ).map(snippet => (
                    <motion.div
                      layoutId={snippet.id}
                      key={snippet.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, snippet.id)}
                      className={cn(
                        "bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-md transition-all relative overflow-hidden",
                        draggedItem === snippet.id && "opacity-50 ring-2 ring-indigo-500/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-1">{snippet.title}</h4>
                        <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg uppercase tracking-wider">
                          {snippet.language}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                        {snippet.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {snippet.libraries && snippet.libraries.slice(0, 3).map((lib: string) => (
                          <span key={lib} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            {lib}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <Calendar className="w-3 h-3" />
                          {new Date(snippet.updated_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-1">
                           {snippet.tags && snippet.tags.slice(0, 2).map((tag: string) => (
                             <span key={tag} className="text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">#{tag}</span>
                           ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>

            {boardType === 'projects' && (
              <div className={cn("p-3 border-t border-x border-b rounded-b-2xl bg-white dark:bg-zinc-900", column.border)}>
                {quickAddColumn === column.id ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={quickAddText}
                      onChange={e => setQuickAddText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdd(column.id)}
                      placeholder="Project name..."
                    />
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setQuickAddColumn(null)} className="text-xs font-bold text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded hover:bg-zinc-100">Cancel</button>
                       <button onClick={() => handleQuickAdd(column.id)} className="text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700">Add</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setQuickAddColumn(column.id)} 
                    className="w-full py-2 flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Quick Add
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trash Drop Zone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => handleDrop(e, 'trash')}
        className={cn(
          "fixed bottom-8 right-8 p-6 rounded-full bg-red-500 text-white shadow-2xl transition-all duration-300 z-50 flex items-center justify-center border-4 border-white dark:border-zinc-900", 
          draggedItem ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-20"
        )}
      >
        <Trash2 className="w-8 h-8" />
      </div>
    </div>
  );
}
