import React, { useState, useEffect } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Plus, CheckCircle, Circle, Clock, Trash2, Edit2, X, Target, Search, ExternalLink, ArrowUp, ArrowDown, ArrowRight, Layout, List, GripVertical } from 'lucide-react';
import { cn, LANGUAGES } from '../lib/utils';
import { useForm } from 'react-hook-form';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', icon: Circle, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200 dark:border-zinc-700' },
  { id: 'In Progress', title: 'In Progress', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  { id: 'Completed', title: 'Completed', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' }
];

export default function ChallengesView() {
  const { challenges, addChallenge, updateChallenge, deleteChallenge } = useSnippets();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'difficulty' | 'priority'>('updated_at');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [hintInput, setHintInput] = useState('');
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (editingId) {
      const challenge = challenges.find(c => c.id === editingId);
      if (challenge) {
        setValue('title', challenge.title);
        setValue('description', challenge.description);
        setValue('difficulty', challenge.difficulty);
        setValue('status', challenge.status);
        setValue('priority', challenge.priority || 'Medium');
        setValue('link', challenge.link || '');
        setValue('language', challenge.language);
        setValue('points', challenge.points || 0);
        setValue('category', challenge.category || '');
        setValue('estimated_time', challenge.estimated_time || '');
        setTags(challenge.tags || []);
        setHints(challenge.hints || []);
        setIsCreating(true);
      }
    }
  }, [editingId, challenges, setValue]);

  const onSubmit = async (data: any) => {
    const challengeData = { ...data, tags, hints };
    if (challengeData.status === 'Completed' && (!editingId || challenges.find(c => c.id === editingId)?.status !== 'Completed')) {
      challengeData.completed_at = Date.now();
    }
    if (editingId) {
      await updateChallenge(editingId, challengeData);
      setEditingId(null);
    } else {
      await addChallenge(challengeData);
    }
    setIsCreating(false);
    reset();
    setTags([]);
    setHints([]);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleClose = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
    setTags([]);
    setHints([]);
  };

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], input: string, setInput: React.Dispatch<React.SetStateAction<string>>) => {
    if (input.trim() && !current.includes(input.trim())) {
      setter([...current, input.trim()]);
      setInput('');
    }
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], item: string) => {
    setter(current.filter(i => i !== item));
  };

  const toggleHint = (challengeId: string, hintIndex: number) => {
    const key = `${challengeId}-${hintIndex}`;
    setExpandedHints(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image
    const element = e.currentTarget as HTMLElement;
    const ghost = element.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.opacity = '0.5';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const challenge = challenges.find(c => c.id === draggedItem);
    if (challenge && challenge.status !== status) {
      const updates: any = { status };
      if (status === 'Completed') {
        updates.completed_at = Date.now();
      }
      await updateChallenge(challenge.id, updates);
    }
    setDraggedItem(null);
  };

  const filteredChallenges = challenges.filter(c => {
    const matchesStatus = filterStatus === 'All' ? true : c.status === filterStatus;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
    }
    if (sortBy === 'priority') {
      const priorityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
      return (priorityOrder[b.priority || 'Medium'] || 2) - (priorityOrder[a.priority || 'Medium'] || 2);
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'Intermediate': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'Advanced': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'text-zinc-500 bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'Medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'Low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />;
    }
  };

  const stats = {
    total: challenges.length,
    completed: challenges.filter(c => c.status === 'Completed').length,
    inProgress: challenges.filter(c => c.status === 'In Progress').length,
    todo: challenges.filter(c => c.status === 'Todo').length
  };

  const totalPoints = challenges.reduce((sum, c) => sum + (c.status === 'Completed' ? (c.points || 0) : 0), 0);
  const level = Math.floor(totalPoints / 100) + 1;
  const nextLevelPoints = level * 100;
  const progressToNextLevel = ((totalPoints % 100) / 100) * 100;

  const getStreak = () => {
    const completedDates = challenges
      .filter(c => c.status === 'Completed' && c.completed_at)
      .map(c => new Date(c.completed_at!).setHours(0,0,0,0))
      .sort((a, b) => b - a);
    
    if (completedDates.length === 0) return 0;
    
    const uniqueDates = Array.from(new Set(completedDates));
    let streak = 0;
    let currentDate = new Date().setHours(0,0,0,0);
    
    if (uniqueDates[0] !== currentDate && uniqueDates[0] !== currentDate - 86400000) {
      return 0; // Streak broken
    }
    
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === currentDate - (i * 86400000) || uniqueDates[i] === currentDate - ((i-1) * 86400000)) {
         streak++;
      } else {
         break;
      }
    }
    return streak;
  };

  const streak = getStreak();

  const renderChallengeCard = (challenge: any, isBoard: boolean = false) => (
    <motion.div
      key={challenge.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable={isBoard}
      onDragStart={(e) => isBoard && handleDragStart(e as any, challenge.id)}
      className={cn(
        "bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden",
        isBoard && "cursor-grab active:cursor-grabbing",
        draggedItem === challenge.id && "opacity-50 ring-2 ring-indigo-500/50"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", 
        challenge.status === 'Completed' ? "bg-emerald-500" : 
        challenge.status === 'In Progress' ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
      )} />
      
      <div className="flex items-start justify-between gap-4 pl-4">
        {isBoard && (
          <div className="mt-1 text-zinc-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        {!isBoard && (
          <button 
            onClick={() => updateChallenge(challenge.id, { 
              status: challenge.status === 'Completed' ? 'Todo' : 'Completed',
              completed_at: challenge.status !== 'Completed' ? Date.now() : undefined
            })}
            className="mt-1 hover:scale-110 transition-transform flex-shrink-0"
          >
            {getStatusIcon(challenge.status)}
          </button>
        )}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={cn(
              "text-xl font-bold text-zinc-900 dark:text-zinc-100",
              challenge.status === 'Completed' && "line-through text-zinc-400 dark:text-zinc-600"
            )}>
              {challenge.title}
            </h3>
            <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border tracking-wide", getDifficultyColor(challenge.difficulty))}>
              {challenge.difficulty}
            </span>
            {challenge.priority && (
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1", getPriorityColor(challenge.priority))}>
                {challenge.priority === 'High' && <ArrowUp className="w-3 h-3" />}
                {challenge.priority === 'Low' && <ArrowDown className="w-3 h-3" />}
                {challenge.priority === 'Medium' && <ArrowRight className="w-3 h-3" />}
                {challenge.priority}
              </span>
            )}
            {challenge.language && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                {challenge.language}
              </span>
            )}
            {challenge.points && challenge.points > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {challenge.points} XP
              </span>
            )}
            {challenge.tags && challenge.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                #{tag}
              </span>
            ))}
          </div>
          {challenge.description && (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-3xl">
              {challenge.description}
            </p>
          )}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="space-y-2 mt-3">
              {challenge.hints.map((hint: string, index: number) => {
                const isExpanded = expandedHints.has(`${challenge.id}-${index}`);
                return (
                  <div key={index} className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleHint(challenge.id, index)}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex justify-between items-center"
                    >
                      <span>Hint {index + 1}</span>
                      {isExpanded ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                        {hint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {challenge.link && (
            <a 
              href={challenge.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              View Problem Source
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleEdit(challenge.id)}
            className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => deleteChallenge(challenge.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-[calc(100vh-73px)] w-full min-w-0 flex flex-col p-4 md:p-8 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-2 flex items-center gap-3">
            <Target className="w-10 h-10 text-red-500" />
            Challenges
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">Track your coding challenges and problem-solving progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'board' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Layout className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-zinc-900/10"
          >
            <Plus className="w-5 h-5" />
            New Challenge
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 space-y-8 pr-2 min-h-0 min-w-0 custom-scrollbar">
        {/* Gamification Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 backdrop-blur-sm">
                <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-md" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-sm">
                LVL {level}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Level {level} Coder</h2>
              <div className="flex items-center gap-4 text-indigo-100 text-sm font-medium">
                <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {totalPoints} Total Points</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {streak} Day Streak 🔥</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-bold text-indigo-100">
              <span>Progress to Lvl {level + 1}</span>
              <span>{totalPoints % 100} / 100 XP</span>
            </div>
            <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressToNextLevel}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total Challenges</div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">Completed</div>
            <div className="text-3xl font-black text-emerald-500">{stats.completed}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-3xl font-black text-amber-500">{stats.inProgress}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">To Do</div>
            <div className="text-3xl font-black text-zinc-400">{stats.todo}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 px-2">
            {['All', 'Todo', 'In Progress', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                  filterStatus === status 
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100" 
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto px-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search challenges..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="updated_at">Newest</option>
              <option value="difficulty">Difficulty</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredChallenges.map(challenge => renderChallengeCard(challenge, false))}
            </AnimatePresence>
            
            {filteredChallenges.length === 0 && (
              <div className="text-center py-20 text-zinc-400">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No challenges found in this category.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-6 h-[600px] overflow-x-auto pb-4">
            {COLUMNS.map(column => {
              const columnChallenges = filteredChallenges.filter(c => c.status === column.id);
              const Icon = column.icon;
              
              return (
                <div 
                  key={column.id} 
                  className="flex-1 min-w-[350px] flex flex-col bg-zinc-100/50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden"
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className={cn("p-4 border-b flex items-center justify-between", column.bg, column.border)}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-5 h-5", column.color)} />
                      <h3 className="font-black text-zinc-900 dark:text-zinc-100">{column.title}</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-500 shadow-sm">
                      {columnChallenges.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <AnimatePresence mode="popLayout">
                      {columnChallenges.map(challenge => renderChallengeCard(challenge, true))}
                    </AnimatePresence>
                    {columnChallenges.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-400 gap-2">
                        <Icon className="w-6 h-6 opacity-50" />
                        <span className="text-sm font-medium">Drop challenges here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
                <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100">
                  {editingId ? 'Edit Challenge' : 'New Challenge'}
                </h3>
                <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Title</label>
                    <input 
                      {...register('title', { required: true })}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                      placeholder="e.g. Implement Binary Search"
                      autoFocus
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Description</label>
                    <textarea 
                      {...register('description')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                      placeholder="Describe the challenge requirements..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Difficulty</label>
                    <select 
                      {...register('difficulty')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Priority</label>
                    <select 
                      {...register('priority')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Category</label>
                    <input 
                      {...register('category')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. Algorithms"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Language</label>
                    <select 
                      {...register('language')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="JavaScript">JavaScript</option>
                      <option value="TypeScript">TypeScript</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="C++">C++</option>
                      <option value="Go">Go</option>
                      <option value="Rust">Rust</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Points (XP)</label>
                    <input 
                      type="number"
                      {...register('points', { valueAsNumber: true })}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Est. Time</label>
                    <input 
                      {...register('estimated_time')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 2 hours"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">External Link</label>
                    <input 
                      {...register('link')}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="https://leetcode.com/..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center gap-1">
                          #{tag}
                          <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-indigo-800 dark:hover:text-indigo-200">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          if (!tags.includes(tagInput.trim())) {
                            setTags([...tags, tagInput.trim()]);
                          }
                          setTagInput('');
                        }
                      }}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Type tag and press Enter..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Hints</label>
                    <div className="space-y-2 mb-2">
                      {hints.map((hint, index) => (
                        <div key={index} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <span className="text-xs font-bold text-zinc-400 w-6">{index + 1}.</span>
                          <span className="text-sm flex-1">{hint}</span>
                          <button type="button" onClick={() => setHints(hints.filter((_, i) => i !== index))} className="text-zinc-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        value={hintInput}
                        onChange={(e) => setHintInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && hintInput.trim()) {
                            e.preventDefault();
                            setHints([...hints, hintInput.trim()]);
                            setHintInput('');
                          }
                        }}
                        className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Add a hint..."
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (hintInput.trim()) {
                            setHints([...hints, hintInput.trim()]);
                            setHintInput('');
                          }
                        }}
                        className="px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    {editingId ? 'Update Challenge' : 'Create Challenge'}
                  </button>
                </div>
              </form>


            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
