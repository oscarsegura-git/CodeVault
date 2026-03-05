import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism, { getPrismLang } from '../lib/prism-setup';
import { useSnippets } from '../context/SnippetContext';
import { useConfirm } from '../context/ConfirmContext';
import SearchableSelect from './SearchableSelect';
import LibrarySelector from './LibrarySelector';
import { LANGUAGES } from '../lib/utils';
import { BookOpen, Search, Plus, Trash2, Edit2, X, Tag, Link as LinkIcon, Hash, Layers, Copy, Clock, Brain, ChevronRight, ChevronLeft, Zap, Book, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const CATEGORIES = ['General', 'Syntax', 'Data Structure', 'Algorithm', 'Pattern', 'Library', 'Tool', 'Variable', 'Class', 'Type', 'Function'] as const;
const COMPLEXITY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const LEARNING_STATUSES = ['Learning', 'Mastered', 'Reference'] as const;

export default function GlossaryView() {
  const { definitions, addDefinition, updateDefinition, deleteDefinition } = useSnippets();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'term' | 'updated_at'>('term');

  // Form state
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('General');
  const [complexity, setComplexity] = useState<typeof COMPLEXITY_LEVELS[number]>('Beginner');
  const [learningStatus, setLearningStatus] = useState<typeof LEARNING_STATUSES[number]>('Learning');
  const [language, setLanguage] = useState('');
  const [example, setExample] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [relatedTerms, setRelatedTerms] = useState<string[]>([]);
  const [relatedInput, setRelatedInput] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [referenceInput, setReferenceInput] = useState('');
  const [libraries, setLibraries] = useState<string[]>([]);

  // Flashcards state
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const filteredDefinitions = definitions.filter(d => {
    const termStr = d.term || '';
    const defStr = d.definition || '';
    const matchesSearch = termStr.toLowerCase().includes(search.toLowerCase()) || 
                          defStr.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? d.category === selectedCategory : true;
    const matchesTag = selectedTag ? (d.tags || []).includes(selectedTag) : true;
    const matchesLanguage = selectedLanguage ? d.language === selectedLanguage : true;
    const matchesLibrary = selectedLibrary ? (d.libraries || []).includes(selectedLibrary) : true;
    
    return matchesSearch && matchesCategory && matchesTag && matchesLanguage && matchesLibrary;
  }).sort((a, b) => {
    if (sortBy === 'term') return a.term.localeCompare(b.term);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const allTags = Array.from(new Set(definitions.flatMap(d => d.tags || []))).sort();
  const allLanguages = Array.from(new Set(definitions.map(d => d.language).filter(Boolean))).sort();
  
  // Filter libraries based on selected language
  const availableLibraries = React.useMemo(() => {
    let libs = definitions;
    if (selectedLanguage) {
      libs = libs.filter(d => d.language === selectedLanguage);
    }
    return Array.from(new Set(libs.flatMap(d => d.libraries || []))).sort();
  }, [definitions, selectedLanguage]);

  const handleCreate = async () => {
    console.log('Creating term:', term, definition);
    if (!term || !definition) {
      console.log('Missing term or definition');
      return;
    }
    try {
      await addDefinition({ 
        term, definition, category, complexity, learning_status: learningStatus, 
        language, example, tags, related_terms: relatedTerms, references, libraries
      });
      console.log('Definition added successfully');
      resetForm();
    } catch (error) {
      console.error('Error adding definition:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !term || !definition) return;
    await updateDefinition(editingId, { 
      term, definition, category, complexity, learning_status: learningStatus,
      language, example, tags, related_terms: relatedTerms, references, libraries
    });
    resetForm();
  };

  const markAsMastered = async (def: any) => {
    await updateDefinition(def.id, { ...def, learning_status: 'Mastered' });
    // Optional: Show toast
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Definition',
      message: 'Are you sure you want to delete this definition?',
      isDestructive: true,
      confirmText: 'Delete'
    });
    if (confirmed) {
      await deleteDefinition(id);
    }
  };

  const startEdit = (def: any) => {
    setEditingId(def.id);
    setTerm(def.term);
    setDefinition(def.definition);
    setCategory(def.category || 'General');
    setComplexity(def.complexity || 'Beginner');
    setLearningStatus(def.learning_status || 'Learning');
    setLanguage(def.language || '');
    setExample(def.example || '');
    setTags(def.tags || []);
    setRelatedTerms(def.related_terms || []);
    setReferences(def.references || []);
    setLibraries(def.libraries || []);
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setTerm('');
    setDefinition('');
    setCategory('General');
    setComplexity('Beginner');
    setLearningStatus('Learning');
    setLanguage('');
    setExample('');
    setTags([]);
    setRelatedTerms([]);
    setReferences([]);
    setLibraries([]);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const startFlashcards = () => {
    if (filteredDefinitions.length === 0) return;
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setIsFlashcardMode(true);
  };

  const nextCard = () => {
    setIsCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredDefinitions.length);
    }, 150);
  };

  const prevCard = () => {
    setIsCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredDefinitions.length) % filteredDefinitions.length);
    }, 150);
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 custom-scrollbar">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">Glossary</h1>
          <p className="text-zinc-500 font-medium">Your personal dictionary for code terms and concepts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (filteredDefinitions.length === 0) return;
              const randomIndex = Math.floor(Math.random() * filteredDefinitions.length);
              setCurrentCardIndex(randomIndex);
              setIsCardFlipped(false);
              setIsFlashcardMode(true);
            }}
            disabled={filteredDefinitions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 dark:border-amber-800 shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Random Term
          </button>
          <button
            onClick={startFlashcards}
            disabled={filteredDefinitions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-800 shadow-sm"
          >
            <Brain className="w-4 h-4" />
            Practice Flashcards
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(definitions, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'glossary.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 py-2.5 px-4 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Term
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 mb-6 shrink-0 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
          <input 
            type="text" 
            placeholder="Search definitions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center px-2">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="term">Sort: A-Z</option>
            <option value="updated_at">Sort: Newest</option>
          </select>

          <select 
            value={selectedLanguage || ''} 
            onChange={(e) => setSelectedLanguage(e.target.value || null)}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Languages</option>
            {allLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select 
            value={selectedLibrary || ''} 
            onChange={(e) => setSelectedLibrary(e.target.value || null)}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Libraries</option>
            {availableLibraries.map(lib => (
              <option key={lib} value={lib}>{lib}</option>
            ))}
          </select>

          <select 
            value={selectedTag || ''} 
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
          
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-2 shrink-0 hidden md:block" />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                selectedCategory === null 
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" 
                  : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                  selectedCategory === cat 
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" 
                    : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {editingId ? 'Edit Definition' : 'New Definition'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Term</label>
                        <input 
                          type="text" 
                          value={term}
                          onChange={(e) => setTerm(e.target.value)}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-lg"
                          placeholder="e.g. Closure"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Language / Context</label>
                        <SearchableSelect
                          options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                          value={language}
                          onChange={(val) => setLanguage(val as string)}
                          placeholder="Select Language"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Definition</label>
                      <textarea 
                        value={definition}
                        onChange={(e) => setDefinition(e.target.value)}
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[120px] text-base leading-relaxed"
                        placeholder="Explain the concept clearly..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Example Code</label>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-[#0d1117] min-h-[150px] flex flex-col">
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-100/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{language || 'Text'}</span>
                          <button 
                            onClick={() => copyToClipboard(example)}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            title="Copy Code"
                            type="button"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 relative overflow-auto custom-scrollbar max-h-[400px]">
                          <Editor
                            value={example}
                            onValueChange={setExample}
                            highlight={code => {
                              const lang = getPrismLang(language);
                              return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                            }}
                            padding={16}
                            tabSize={2}
                            insertSpaces={true}
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '14px',
                              minHeight: '200px',
                              outline: 'none',
                              backgroundColor: 'transparent',
                              lineHeight: '1.6',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Complexity</label>
                        <select 
                          value={complexity}
                          onChange={(e) => setComplexity(e.target.value as any)}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {COMPLEXITY_LEVELS.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Learning Status</label>
                        <select 
                          value={learningStatus}
                          onChange={(e) => setLearningStatus(e.target.value as any)}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {LEARNING_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Libraries</label>
                      <LibrarySelector selectedLibraries={libraries} onChange={setLibraries} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map(tag => (
                          <span key={tag} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                            {tag}
                            <button onClick={() => removeItem(setTags, tags, tag)}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem(setTags, tags, tagInput, setTagInput)}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                        placeholder="Add tag and press Enter"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Related Terms</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {relatedTerms.map(term => (
                          <span key={term} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                            {term}
                            <button onClick={() => removeItem(setRelatedTerms, relatedTerms, term)}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        value={relatedInput}
                        onChange={(e) => setRelatedInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem(setRelatedTerms, relatedTerms, relatedInput, setRelatedInput)}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                        placeholder="Add term..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">References (URLs)</label>
                      <div className="flex flex-col gap-2 mb-2">
                        {references.map(ref => (
                          <div key={ref} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg text-xs truncate">
                            <span className="truncate flex-1">{ref}</span>
                            <button onClick={() => removeItem(setReferences, references, ref)}><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem(setReferences, references, referenceInput, setReferenceInput)}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                        placeholder="Add URL..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                <button 
                  onClick={resetForm}
                  className="px-6 py-3 text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={editingId ? handleUpdate : handleCreate}
                  className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black rounded-xl transition-colors shadow-lg shadow-zinc-900/10"
                >
                  {editingId ? 'Update Definition' : 'Save Definition'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredDefinitions.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No definitions found. Start building your glossary!</p>
            </div>
          ) : (
            filteredDefinitions.map((def) => (
              <motion.div 
                key={def.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
              <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={(e) => { e.stopPropagation(); startEdit(def); }}
                  className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(def.id); }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 pr-20">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      def.category === 'Syntax' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      def.category === 'Data Structure' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                      def.category === 'Algorithm' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                      def.category === 'Variable' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                      def.category === 'Class' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    )}>
                      {def.category}
                    </span>
                    <span className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      {def.complexity || 'Beginner'}
                    </span>
                    {def.language && (
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {def.language}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">{def.term}</h3>
                  
                  <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                    <p>{def.definition}</p>
                  </div>

                  {(def.tags?.length > 0 || def.related_terms?.length > 0 || def.libraries?.length > 0) && (
                    <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      {def.libraries && def.libraries.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Book className="w-3 h-3 text-zinc-400" />
                          <div className="flex gap-2">
                            {def.libraries.map(lib => (
                              <span key={lib} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                {lib}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {def.tags && def.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-zinc-400" />
                          <div className="flex gap-2">
                            {def.tags.map(tag => (
                              <span key={tag} className="text-xs text-zinc-500 font-medium">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {def.related_terms && def.related_terms.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Layers className="w-3 h-3 text-zinc-400" />
                          <div className="flex gap-2">
                            {def.related_terms.map(term => (
                              <span key={term} className="text-xs text-indigo-500 font-bold cursor-pointer hover:underline" onClick={() => setSearch(term)}>
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {def.example && (
                  <div className="w-full md:w-1/3 min-w-[300px]">
                    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-inner h-full relative group/code">
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase ml-2">Example</span>
                        <button 
                          onClick={() => copyToClipboard(def.example)}
                          className="ml-auto p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition-colors opacity-0 group-hover/code:opacity-100"
                          title="Copy Example"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                        {def.example}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Updated {new Date(def.updated_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))
        )}
        </div>
      </div>
      {/* Flashcards Modal */}
      <AnimatePresence>
        {isFlashcardMode && filteredDefinitions.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-6 text-white">
                <div className="flex items-center gap-2 font-bold">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  Flashcards Practice
                </div>
                <div className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  {currentCardIndex + 1} / {filteredDefinitions.length}
                </div>
                <button 
                  onClick={() => setIsFlashcardMode(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div 
                className="w-full aspect-[3/2] perspective-1000 cursor-pointer group"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                <motion.div 
                  className="w-full h-full relative preserve-3d transition-transform duration-500"
                  animate={{ rotateX: isCardFlipped ? 180 : 0 }}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-12 text-center">
                    <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4">
                      {filteredDefinitions[currentCardIndex].category || 'General'}
                    </span>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-zinc-100">
                      {filteredDefinitions[currentCardIndex].term}
                    </h2>
                    <p className="text-zinc-400 mt-8 text-sm font-medium">Click to reveal definition</p>
                  </div>

                  {/* Back */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-12 text-center text-white"
                    style={{ transform: 'rotateX(180deg)' }}
                  >
                    <div className="overflow-y-auto max-h-full custom-scrollbar">
                      <p className="text-xl leading-relaxed font-medium">
                        {filteredDefinitions[currentCardIndex].definition}
                      </p>
                      {filteredDefinitions[currentCardIndex].example && (
                        <div className="mt-8 p-4 bg-black/20 rounded-xl text-left">
                          <pre className="text-sm font-mono whitespace-pre-wrap">
                            {filteredDefinitions[currentCardIndex].example}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button 
                  onClick={(e) => { e.stopPropagation(); prevCard(); }}
                  className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-900 dark:text-zinc-100"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsCardFlipped(!isCardFlipped); }}
                  className="px-8 py-4 bg-white dark:bg-zinc-900 rounded-full shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-bold text-zinc-900 dark:text-zinc-100"
                >
                  {isCardFlipped ? 'Show Term' : 'Show Definition'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextCard(); }}
                  className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-900 dark:text-zinc-100"
                  title="Next Card"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsMastered(filteredDefinitions[currentCardIndex]);
                  nextCard();
                }}
                className="mt-6 px-6 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark as Mastered
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
