import React, { useState, useEffect } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { useConfirm } from '../context/ConfirmContext';
import { Briefcase, Plus, Trash2, Edit3, ChevronRight, Code, ArrowLeft, GripVertical, X, Layout, Columns, Rows, Check, Link as LinkIcon, Image as ImageIcon, Book, Calendar } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { cn } from '../lib/utils';
import SnippetCard from './SnippetCard';
import LibrarySelector from './LibrarySelector';

interface ProjectSectionItem {
  id: string; // Unique ID for the item in the section
  type: 'snippet' | 'note' | 'link' | 'task' | 'image' | 'concept';
  content?: string; // For notes, links, tasks, images (url)
  snippetId?: string; // Optional now
  conceptId?: string; // For concepts
  description?: string; // User description for this specific instance
  checked?: boolean; // For tasks
  dueDate?: string; // For tasks
}

interface ProjectSection {
  id: string;
  title: string;
  description?: string;
  layout: 'vertical' | 'horizontal';
  columns?: 1 | 2 | 3;
  items: ProjectSectionItem[];
}

interface ProjectContent {
  sections: ProjectSection[];
}

export default function ProjectView() {
  const { projects, addProject, deleteProject, updateProjectContent, updateProject, snippets, updateSnippet, definitions } = useSnippets();
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDeadline, setNewDeadline] = useState<string>('');
  const [newLibraries, setNewLibraries] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Project Content State
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const lastSavedContentRef = React.useRef<string>('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isSelectingSnippet, setIsSelectingSnippet] = useState<string | null>(null); // sectionId
  const [isSelectingConcept, setIsSelectingConcept] = useState<string | null>(null); // sectionId
  const [snippetSearch, setSnippetSearch] = useState('');
  const [conceptSearch, setConceptSearch] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectSnippets = snippets.filter(s => s.project_id === selectedProjectId);

  useEffect(() => {
    if (selectedProject) {
      setNewName(selectedProject.name);
      setNewDescription(selectedProject.description || '');
      setNewStatus(selectedProject.status || 'active');
      setNewPriority(selectedProject.priority || 'Medium');
      setNewDeadline(selectedProject.deadline ? new Date(selectedProject.deadline).toISOString().split('T')[0] : '');
      setNewLibraries(selectedProject.libraries || []);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject?.content && selectedProject.content !== lastSavedContentRef.current) {
      try {
        const content: ProjectContent = JSON.parse(selectedProject.content);
        setSections(content.sections || []);
        lastSavedContentRef.current = selectedProject.content;
      } catch (e) {
        setSections([]);
      }
    } else if (!selectedProject?.content) {
      setSections([]);
      lastSavedContentRef.current = '';
    }
  }, [selectedProject]);

  const saveContent = async (newSections: ProjectSection[]) => {
    setSections(newSections);
    const contentStr = JSON.stringify({ sections: newSections });
    lastSavedContentRef.current = contentStr;
    if (selectedProjectId) {
      await updateProjectContent(selectedProjectId, contentStr);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      await addProject(newName.trim(), newDescription, newStatus, newLibraries, newPriority, newDeadline ? new Date(newDeadline).getTime() : undefined);
      setNewName('');
      setNewDescription('');
      setNewStatus('active');
      setNewPriority('Medium');
      setNewDeadline('');
      setNewLibraries([]);
      setIsAdding(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectId && newName.trim()) {
      await updateProject(selectedProjectId, newName.trim(), newDescription, newStatus, newLibraries, newPriority, newDeadline ? new Date(newDeadline).getTime() : undefined);
      setIsEditing(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? All associated snippets will be preserved but unlinked.',
      isDestructive: true,
      confirmText: 'Delete'
    });
    if (confirmed) {
      await deleteProject(id);
      if (selectedProjectId === id) setSelectedProjectId(null);
    }
  };

  const addSection = async () => {
    if (newSectionName.trim()) {
      const newSection: ProjectSection = {
        id: crypto.randomUUID(),
        title: newSectionName.trim(),
        description: '',
        layout: 'vertical',
        columns: 1,
        items: []
      };
      await saveContent([...sections, newSection]);
      setNewSectionName('');
      setIsAddingSection(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    const confirmed = await confirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section? Snippets will remain in the project.',
      isDestructive: true,
      confirmText: 'Delete'
    });
    if (confirmed) {
      await saveContent(sections.filter(s => s.id !== sectionId));
    }
  };

  const toggleLayout = async (sectionId: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        const nextLayout = s.layout === 'vertical' ? 'horizontal' : 'vertical';
        return { 
          ...s, 
          layout: nextLayout as 'vertical' | 'horizontal',
          columns: nextLayout === 'vertical' ? 1 : 2
        };
      }
      return s;
    });
    await saveContent(newSections);
  };

  const updateSectionColumns = async (sectionId: string, cols: 1 | 2 | 3) => {
    const newSections = sections.map(s => 
      s.id === sectionId ? { ...s, columns: cols, layout: cols === 1 ? 'vertical' : 'horizontal' as any } : s
    );
    await saveContent(newSections);
  };

  const updateSectionDescription = async (sectionId: string, desc: string) => {
    const newSections = sections.map(s => 
      s.id === sectionId ? { ...s, description: desc } : s
    );
    await saveContent(newSections);
  };

  const addSnippetToSection = async (sectionId: string, snippetId: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        // Allow duplicates by generating a new unique ID for the item
        const newItem: ProjectSectionItem = {
          id: crypto.randomUUID(),
          type: 'snippet',
          snippetId: snippetId
        };
        return { ...s, items: [...(s.items || []), newItem] };
      }
      return s;
    });
    await saveContent(newSections);
    setIsSelectingSnippet(null);
  };

  const addConceptToSection = async (sectionId: string, conceptId: string) => {
    console.log('Adding concept to section:', sectionId, conceptId);
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        const newItem: ProjectSectionItem = {
          id: crypto.randomUUID(),
          type: 'concept',
          conceptId: conceptId
        };
        console.log('New item:', newItem);
        return { ...s, items: [...(s.items || []), newItem] };
      }
      return s;
    });
    console.log('New sections:', newSections);
    await saveContent(newSections);
    setIsSelectingConcept(null);
  };

  const addItemToSection = async (sectionId: string, type: 'note' | 'link' | 'task' | 'image', content: string = '') => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        const newItem: ProjectSectionItem = {
          id: crypto.randomUUID(),
          type,
          content,
          checked: type === 'task' ? false : undefined
        };
        return { ...s, items: [...(s.items || []), newItem] };
      }
      return s;
    });
    await saveContent(newSections);
  };

  const updateItemContent = async (sectionId: string, itemId: string, content: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: (s.items || []).map(item => item.id === itemId ? { ...item, content } : item)
        };
      }
      return s;
    });
    await saveContent(newSections);
  };

  const toggleTask = async (sectionId: string, itemId: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: (s.items || []).map(item => item.id === itemId ? { ...item, checked: !item.checked } : item)
        };
      }
      return s;
    });
    await saveContent(newSections);
  };

  const removeSnippetFromSection = async (sectionId: string, itemId: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, items: (s.items || []).filter(item => item.id !== itemId) };
      }
      return s;
    });
    await saveContent(newSections);
  };

  const duplicateSnippetInSection = async (sectionId: string, itemId: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        const itemToDuplicate = (s.items || []).find(item => item.id === itemId);
        if (itemToDuplicate) {
          const newItem: ProjectSectionItem = {
            ...itemToDuplicate,
            id: crypto.randomUUID()
          };
          const index = s.items.findIndex(item => item.id === itemId);
          const newItems = [...s.items];
          newItems.splice(index + 1, 0, newItem);
          return { ...s, items: newItems };
        }
      }
      return s;
    });
    await saveContent(newSections);
  };

  const updateItemDescription = async (sectionId: string, itemId: string, desc: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: (s.items || []).map(item => item.id === itemId ? { ...item, description: desc } : item)
        };
      }
      return s;
    });
    await saveContent(newSections);
  };

  const updateItemDueDate = async (sectionId: string, itemId: string, date: string) => {
    const newSections = sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: (s.items || []).map(item => item.id === itemId ? { ...item, dueDate: date } : item)
        };
      }
      return s;
    });
    await saveContent(newSections);
  };

  // Filter snippets that are NOT in the current section (or maybe just show all to allow picking)
  const availableSnippets = snippets.filter(s => 
    (s.title.toLowerCase().includes(snippetSearch.toLowerCase()) || 
     (s.description && s.description.toLowerCase().includes(snippetSearch.toLowerCase())))
  );

  const availableConcepts = definitions.filter(d => 
    d.term.toLowerCase().includes(conceptSearch.toLowerCase()) || 
    (d.definition && d.definition.toLowerCase().includes(conceptSearch.toLowerCase()))
  );

  if (selectedProjectId && selectedProject) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 md:p-8 h-[calc(100vh-73px)] w-full min-w-0 flex flex-col"
      >
        <div className="flex items-center gap-4 mb-8 shrink-0">
          <button 
            onClick={() => setSelectedProjectId(null)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{selectedProject.name}</h2>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                selectedProject.status === 'completed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                selectedProject.status === 'planning' ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400" :
                selectedProject.status === 'paused' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              )}>
                {selectedProject.status || 'active'}
              </span>
              {selectedProject.priority && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  selectedProject.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  selectedProject.priority === 'Medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}>
                  {selectedProject.priority}
                </span>
              )}
              {selectedProject.deadline && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedProject.deadline).toLocaleDateString()}
                </span>
              )}
              <span>•</span>
              <span>{projectSnippets.length} snippets</span>
              {selectedProject.libraries && selectedProject.libraries.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex gap-1">
                    {selectedProject.libraries.map(lib => (
                      <span key={lib} className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium">
                        {lib}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            title="Edit Project Details"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800"
              >
                <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">Edit Project</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <input 
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project Name"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                  />
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20 resize-none h-24"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Deadline</label>
                      <input
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Libraries</label>
                    <LibrarySelector selectedLibraries={newLibraries} onChange={setNewLibraries} />
                  </div>
                  <div className="flex items-center gap-2 w-full pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 rounded-xl font-medium text-sm"
                    >
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-zinc-500 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto pb-20 space-y-6 min-h-0 min-w-0 custom-scrollbar pr-2">
          {sections.map(section => {
            const tasks = (section.items || []).filter(i => i.type === 'task');
            const completedTasks = tasks.filter(i => i.checked).length;
            const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

            return (
            <div key={section.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{section.title}</h3>
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[10px] font-bold uppercase tracking-wider">
                      {(section.items || []).length} Snippets
                    </span>
                  </div>
                  {tasks.length > 0 && (
                    <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  )}
                  <textarea 
                    value={section.description || ''}
                    onChange={(e) => updateSectionDescription(section.id, e.target.value)}
                    placeholder="Add a description for this block..."
                    className="w-full bg-transparent border-none p-0 text-sm text-zinc-500 focus:ring-0 resize-none h-auto min-h-[1.5rem] scrollbar-hide"
                    rows={1}
                  />
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  {[1, 2, 3].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => updateSectionColumns(section.id, cols as any)}
                      className={cn(
                        "p-2 rounded-lg transition-all flex items-center gap-1.5",
                        (section.columns || (section.layout === 'vertical' ? 1 : 2)) === cols 
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800" 
                          : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                      title={`${cols} Column${cols > 1 ? 's' : ''}`}
                    >
                      {cols === 1 ? <Rows className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-bold">{cols}</span>
                    </button>
                  ))}
                  <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                  <button 
                    onClick={() => deleteSection(section.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className={cn(
                "grid gap-3",
                (section.columns || (section.layout === 'vertical' ? 1 : 2)) === 1 ? "grid-cols-1" : 
                (section.columns || (section.layout === 'vertical' ? 1 : 2)) === 2 ? "grid-cols-1 md:grid-cols-2" : 
                "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}>
                {(section.items || []).map(item => {
                  const itemType = item.type || 'snippet'; // Default to snippet for legacy data

                  if (itemType === 'snippet') {
                    const snippet = snippets.find(s => s.id === item.snippetId);
                    if (!snippet) return null;
                    
                    return (
                      <div key={item.id} className="group relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col shadow-lg">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                          <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-editor', { detail: snippet }))}
                            className="p-1.5 bg-zinc-800/80 backdrop-blur-sm text-zinc-400 hover:text-white rounded-lg transition-colors"
                            title="Edit Snippet"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => duplicateSnippetInSection(section.id, item.id)}
                            className="p-1.5 bg-zinc-800/80 backdrop-blur-sm text-zinc-400 hover:text-indigo-400 rounded-lg transition-colors"
                            title="Duplicate in Section"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => removeSnippetFromSection(section.id, item.id)}
                            className="p-1.5 bg-zinc-800/80 backdrop-blur-sm text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Remove from Section"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="bg-zinc-900/50 px-4 py-2 flex items-center justify-between border-b border-white/5">
                          <span className="text-xs font-bold text-zinc-200 truncate max-w-[70%]">{snippet.title}</span>
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-mono uppercase tracking-wider">
                            {snippet.language}
                          </span>
                        </div>
                        
                        <div className="relative flex-1 bg-zinc-950">
                          <pre className="p-3 text-[11px] font-mono text-zinc-400 overflow-x-auto scrollbar-hide max-h-32">
                            <code>{snippet.code}</code>
                          </pre>
                        </div>

                        <div className="px-3 py-2 bg-zinc-900/30 border-t border-white/5">
                          <textarea 
                            value={item.description || ''}
                            onChange={(e) => updateItemDescription(section.id, item.id, e.target.value)}
                            placeholder="Add implementation notes..."
                            className="w-full bg-transparent border-none p-0 text-[10px] text-zinc-500 focus:text-zinc-300 focus:ring-0 resize-none h-auto min-h-[1rem] scrollbar-hide transition-colors"
                            rows={1}
                          />
                        </div>
                      </div>
                    );
                  } else if (itemType === 'concept') {
                    const concept = definitions.find(d => d.id === item.conceptId);
                    if (!concept) return null;
                    
                    return (
                      <div key={item.id} className="group relative bg-blue-50 dark:bg-blue-900/10 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all flex flex-col shadow-sm">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                          <button 
                            onClick={() => removeSnippetFromSection(section.id, item.id)}
                            className="p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-blue-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Remove from Section"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="px-4 py-3 flex items-start gap-3 border-b border-blue-100 dark:border-blue-800/30">
                          <div className="p-2 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                            <Book className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">{concept.term}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">{concept.category}</span>
                              {concept.language && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-l border-blue-200 dark:border-blue-800/50 pl-2">{concept.language}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 flex-1">
                          <p className="text-xs text-blue-800 dark:text-blue-200/80 line-clamp-3 leading-relaxed">
                            {concept.definition}
                          </p>
                        </div>

                        <div className="px-3 py-2 bg-white/50 dark:bg-black/20 border-t border-blue-100 dark:border-blue-800/30">
                          <textarea 
                            value={item.description || ''}
                            onChange={(e) => updateItemDescription(section.id, item.id, e.target.value)}
                            placeholder="Add reference notes..."
                            className="w-full bg-transparent border-none p-0 text-[10px] text-blue-600/70 dark:text-blue-400/70 focus:text-blue-800 dark:focus:text-blue-300 focus:ring-0 resize-none h-auto min-h-[1rem] scrollbar-hide transition-colors"
                            rows={1}
                          />
                        </div>
                      </div>
                    );
                  } else if (itemType === 'note') {
                    return (
                      <div key={item.id} className="group relative bg-amber-50 dark:bg-amber-900/10 rounded-xl overflow-hidden border border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800 transition-all flex flex-col shadow-sm min-h-[120px]">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button 
                            onClick={() => removeSnippetFromSection(section.id, item.id)}
                            className="p-1.5 bg-white/50 dark:bg-black/20 backdrop-blur-sm text-amber-700 dark:text-amber-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-4 flex-1">
                          <textarea
                            value={item.content || ''}
                            onChange={(e) => updateItemContent(section.id, item.id, e.target.value)}
                            placeholder="Type your note here..."
                            className="w-full h-full bg-transparent border-none p-0 text-sm text-amber-900 dark:text-amber-100 placeholder:text-amber-400/50 focus:ring-0 resize-none"
                          />
                        </div>
                      </div>
                    );
                  } else if (itemType === 'task') {
                    return (
                      <div key={item.id} className="group relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center shadow-sm p-3 gap-3">
                        <button
                          onClick={() => toggleTask(section.id, item.id)}
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                            item.checked 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-500"
                          )}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <input
                          value={item.content || ''}
                          onChange={(e) => updateItemContent(section.id, item.id, e.target.value)}
                          placeholder="Task description..."
                          className={cn(
                            "flex-1 bg-transparent border-none p-0 text-sm focus:ring-0",
                            item.checked ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"
                          )}
                        />
                        <input
                          type="date"
                          value={item.dueDate || ''}
                          onChange={(e) => updateItemDueDate(section.id, item.id, e.target.value)}
                          className="bg-transparent border-none text-[10px] text-zinc-400 focus:ring-0 w-auto min-w-[80px]"
                        />
                        <button 
                          onClick={() => removeSnippetFromSection(section.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  } else if (itemType === 'link') {
                    return (
                      <div key={item.id} className="group relative bg-indigo-50 dark:bg-indigo-900/10 rounded-xl overflow-hidden border border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center shadow-sm p-3 gap-3">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <input
                          value={item.content || ''}
                          onChange={(e) => updateItemContent(section.id, item.id, e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 bg-transparent border-none p-0 text-sm text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-400/50 focus:ring-0 font-medium"
                        />
                         <button 
                          onClick={() => removeSnippetFromSection(section.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  } else if (item.type === 'image') {
                    return (
                      <div key={item.id} className="relative group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              value={item.content || ''}
                              onChange={(e) => updateItemContent(section.id, item.id, e.target.value)}
                              placeholder="Image URL..."
                              className="flex-1 bg-transparent border-none p-0 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 font-medium"
                            />
                            <label className="cursor-pointer p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      updateItemContent(section.id, item.id, reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <Plus className="w-3.5 h-3.5" />
                            </label>
                          </div>
                          <button 
                            onClick={() => removeSnippetFromSection(section.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.content && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                            <img 
                              src={item.content} 
                              alt="Project attachment" 
                              className="w-full h-auto max-h-64 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Add Item Buttons */}
                <div className="relative group/add">
                  {isSelectingSnippet === section.id ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-4 absolute top-0 left-0 w-full z-20 flex flex-col" style={{ maxHeight: '300px' }}>
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase">Select Snippet</h4>
                        <button onClick={() => { setIsSelectingSnippet(null); setSnippetSearch(''); }}><X className="w-4 h-4 text-zinc-400" /></button>
                      </div>
                      <div className="mb-3 shrink-0">
                        <input
                          type="text"
                          placeholder="Search snippets..."
                          value={snippetSearch}
                          onChange={(e) => setSnippetSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                        {availableSnippets.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { addSnippetToSection(section.id, s.id); setSnippetSearch(''); }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg truncate flex items-center justify-between group"
                          >
                            <span>{s.title}</span>
                            {s.project_id === selectedProjectId && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0 ml-2">In Project</span>}
                          </button>
                        ))}
                        {availableSnippets.length === 0 && (
                          <p className="text-sm text-zinc-400 text-center py-4">No snippets found.</p>
                        )}
                      </div>
                    </div>
                  ) : isSelectingConcept === section.id ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-4 absolute top-0 left-0 w-full z-20 flex flex-col" style={{ maxHeight: '300px' }}>
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase">Select Concept</h4>
                        <button onClick={() => { setIsSelectingConcept(null); setConceptSearch(''); }}><X className="w-4 h-4 text-zinc-400" /></button>
                      </div>
                      <div className="mb-3 shrink-0">
                        <input
                          type="text"
                          placeholder="Search concepts..."
                          value={conceptSearch}
                          onChange={(e) => setConceptSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                        {availableConcepts.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { addConceptToSection(section.id, c.id); setIsSelectingConcept(null); setConceptSearch(''); }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg flex flex-col gap-1 group"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold">{c.term}</span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0 ml-2">{c.category}</span>
                            </div>
                            {c.example && (
                              <pre className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 p-2 rounded truncate max-w-full">
                                {c.example.substring(0, 50)}...
                              </pre>
                            )}
                          </button>
                        ))}
                        {availableConcepts.length === 0 && (
                          <p className="text-sm text-zinc-400 text-center py-4">No concepts found.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full min-h-[100px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all p-4">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsSelectingSnippet(section.id)}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-indigo-100 dark:group-hover/btn:bg-indigo-900/30 group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400 transition-colors">
                            <Code className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Snippet</span>
                        </button>
                        <button 
                          onClick={() => setIsSelectingConcept(section.id)}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-blue-100 dark:group-hover/btn:bg-blue-900/30 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">
                            <Book className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Concept</span>
                        </button>
                        <button 
                          onClick={() => addItemToSection(section.id, 'note')}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-amber-100 dark:group-hover/btn:bg-amber-900/30 group-hover/btn:text-amber-600 dark:group-hover/btn:text-amber-400 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Note</span>
                        </button>
                        <button 
                          onClick={() => addItemToSection(section.id, 'task')}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-emerald-100 dark:group-hover/btn:bg-emerald-900/30 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400 transition-colors">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Task</span>
                        </button>
                        <button 
                          onClick={() => addItemToSection(section.id, 'link')}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-cyan-100 dark:group-hover/btn:bg-cyan-900/30 group-hover/btn:text-cyan-600 dark:group-hover/btn:text-cyan-400 transition-colors">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Link</span>
                        </button>
                        <button 
                          onClick={() => addItemToSection(section.id, 'image')}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-purple-100 dark:group-hover/btn:bg-purple-900/30 group-hover/btn:text-purple-600 dark:group-hover/btn:text-purple-400 transition-colors">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Image</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ); })}

          {/* Add Section Button */}
          {isAddingSection ? (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">New Section</h3>
              <div className="flex gap-3">
                <input 
                  autoFocus
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Section Title (e.g., 'Database Layer')"
                  className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                />
                <button 
                  onClick={addSection}
                  className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium"
                >
                  Add
                </button>
                <button 
                  onClick={() => setIsAddingSection(false)}
                  className="px-6 py-2 text-zinc-500 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingSection(true)}
              className="w-full py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Section</span>
            </button>
          )}

          {/* Unorganized Snippets (if any are in project but not in sections) */}
          {projectSnippets.filter(s => !sections.some(sec => (sec.items || []).some(item => item.snippetId === s.id))).length > 0 && (
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Unorganized Snippets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectSnippets.filter(s => !sections.some(sec => (sec.items || []).some(item => item.snippetId === s.id))).map(snippet => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 w-full min-w-0"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Projects</h2>
          <p className="text-zinc-500 text-sm">Organize your snippets into focused projects.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
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
                  placeholder="Project Name"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                />
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20 resize-none h-20"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Deadline</label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Libraries</label>
                  <LibrarySelector selectedLibraries={newLibraries} onChange={setNewLibraries} />
                </div>
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

        {projects.map(project => (
          <motion.div 
            key={project.id}
            layout
            onClick={() => setSelectedProjectId(project.id)}
            className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => handleDeleteProject(e, project.id)}
                className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">{project.name}</h3>
            <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{project.description || 'No description provided.'}</p>
            
            {project.libraries && project.libraries.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {project.libraries.slice(0, 3).map((lib: string) => (
                  <span key={lib} className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium border border-indigo-100 dark:border-indigo-800">
                    {lib}
                  </span>
                ))}
                {project.libraries.length > 3 && (
                  <span className="px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded text-[10px] font-medium">
                    +{project.libraries.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {project.snippet_count} Snippets
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
