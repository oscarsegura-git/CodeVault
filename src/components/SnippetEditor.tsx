import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useSnippets } from '../context/SnippetContext';
import SearchableSelect from './SearchableSelect';
import LibrarySelector from './LibrarySelector';
import { 
  X, Save, Code, Tag as TagIcon, Type, Link as LinkIcon, Zap, Brain, 
  Info, AlertCircle, FolderKanban, BookOpen, FlaskConical, Timer,
  Plus, Trash2, Briefcase, GripVertical, Check, Shield, Star, Sparkles, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LANGUAGES, COMPLEXITY_LEVELS, LEARNING_STATUSES } from '../lib/utils';
import Editor from 'react-simple-code-editor';
import Prism, { getPrismLang } from '../lib/prism-setup';
import 'prismjs/themes/prism-tomorrow.css';

export default function SnippetEditor({ isOpen, onClose, initialData }: any) {
  const { addSnippet, updateSnippet, collections, projects, settings } = useSnippets();
  const { register, handleSubmit, reset, setValue, watch, control } = useForm<any>({
    defaultValues: {
      parts: [],
      language: settings.defaultLanguage || 'JavaScript'
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parts"
  });

  const [tags, setTags] = useState<string[]>([]);
  const [libraries, setLibraries] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const codeValue = watch('code', '');
  const parts = watch('parts', []);

  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title);
      setValue('code', initialData.code);
      setValue('language', initialData.language);
      setValue('description', initialData.description);
      setValue('complexity', initialData.complexity);
      setValue('learning_status', initialData.learning_status);
      setValue('source_url', initialData.source_url);
      setValue('performance_notes', initialData.performance_notes);
      setValue('version_info', initialData.version_info);
      setValue('expert_tips', initialData.expert_tips);
      setValue('collection_id', initialData.collection_id || '');
      setValue('project_id', initialData.project_id || '');
      setValue('prerequisites', initialData.prerequisites || '');
      setValue('usage_example', initialData.usage_example || '');
      setValue('test_cases', initialData.test_cases || '');
      setValue('learning_time', initialData.learning_time || '');
      setValue('best_practices', initialData.best_practices || '');
      setValue('common_pitfalls', initialData.common_pitfalls || '');
      setValue('security_implications', initialData.security_implications || '');
      setValue('scalability_notes', initialData.scalability_notes || '');
      setValue('trade_offs', initialData.trade_offs || '');
      setValue('core_concepts', initialData.core_concepts || []);
      setValue('parts', initialData.parts || []);
      setValue('rating', initialData.rating || 5);
      setValue('refactoring_suggestions', initialData.refactoring_suggestions || '');
      setTags(initialData.tags || []);
      setLibraries(initialData.libraries || []);
    } else {
      reset({
        language: settings.defaultLanguage || 'JavaScript',
        complexity: 'Intermediate',
        learning_status: 'Learning',
        collection_id: '',
        project_id: '',
        code: '',
        parts: [],
        rating: 5,
        refactoring_suggestions: ''
      });
      setTags([]);
      setLibraries([]);
    }
    setActiveTab('basic');
  }, [initialData, isOpen, settings.defaultLanguage, setValue, reset]);

  const onSubmit = async (data: any) => {
    if (initialData) {
      const snippetData = { ...initialData, ...data, tags, libraries };
      await updateSnippet(initialData.id, snippetData);
    } else {
      const snippetData = { ...data, tags, libraries };
      await addSnippet(snippetData);
    }
    onClose();
    reset();
    setTags([]);
    setLibraries([]);
  };

  const handleAddTag = (e: any) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800"
      >
        <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-950/30">
          <div className="flex items-center gap-6">
            <h2 className="font-black text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">
              {initialData ? 'Refine Snippet' : 'Craft New Snippet'}
            </h2>
            <div className="flex bg-zinc-200/50 dark:bg-zinc-800 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'basic' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Core
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('expert')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'expert' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Expert Notes
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {activeTab === 'basic' ? (
            <>
              {/* Description at the top, compact */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Brief Description
                </label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 resize-none h-20 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  placeholder="What does this snippet do? Keep it concise..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Type className="w-3 h-3" /> Snippet Title
                  </label>
                  <input
                    {...register('title', { required: true })}
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100 placeholder:font-normal"
                    placeholder="e.g., Optimized Binary Search"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Code className="w-3 h-3" /> Primary Language
                  </label>
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Language"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Complexity
                  </label>
                  <Controller
                    name="complexity"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={COMPLEXITY_LEVELS.map(level => ({ value: level, label: level }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Complexity"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FolderKanban className="w-3 h-3" /> Folder
                  </label>
                  <Controller
                    name="collection_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={[
                          { value: '', label: 'No Folder' },
                          ...collections.map(col => ({ value: col.id, label: col.name }))
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Folder"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" /> Project
                  </label>
                  <Controller
                    name="project_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={[
                          { value: '', label: 'No Project' },
                          ...projects.map(proj => ({ value: proj.id, label: proj.name }))
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Project"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Book className="w-3 h-3" /> Libraries
                </label>
                <LibrarySelector selectedLibraries={libraries} onChange={setLibraries} />
              </div>

              {/* Main Code Block */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Code className="w-3 h-3" /> Main Code Block</span>
                  <span className="text-[9px] font-medium text-zinc-300">Primary Implementation</span>
                </label>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-900 min-h-[300px] focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                  <Editor
                    key={settings.fontSize}
                    value={codeValue}
                    onValueChange={code => setValue('code', code)}
                    highlight={code => {
                      const lang = getPrismLang(watch('language'));
                      return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                    }}
                    padding={24}
                    tabSize={2}
                    insertSpaces={true}
                    style={{
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: settings.fontSize || '14px',
                      minHeight: '300px',
                      outline: 'none',
                      color: '#fff',
                    }}
                    className="code-editor-textarea"
                    textareaClassName="outline-none"
                    placeholder="// Write or paste your main code here..."
                  />
                </div>
              </div>

              {/* Additional Snippets (Parts) */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Plus className="w-3 h-3" /> Additional Code Blocks
                  </label>
                  <button 
                    type="button"
                    onClick={() => append({ title: '', code: '', language: watch('language') })}
                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Block
                  </button>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 space-y-4 relative group"
                    >
                      <button 
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                        title="Eliminar bloque"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          {...register(`parts.${index}.title` as const)}
                          className="px-4 py-2 text-sm font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="Block Title (e.g., Helper Function)"
                        />
                        <Controller
                          name={`parts.${index}.language` as const}
                          control={control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select Language"
                              className="w-full"
                            />
                          )}
                        />
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-[#0d1117] min-h-[150px]">
                        <Editor
                          value={watch(`parts.${index}.code` as const) || ''}
                          onValueChange={code => setValue(`parts.${index}.code` as const, code)}
                          highlight={code => {
                            const lang = getPrismLang(watch(`parts.${index}.language` as const));
                            return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                          }}
                          padding={16}
                          tabSize={2}
                          insertSpaces={true}
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: settings.fontSize || '14px',
                            minHeight: '150px',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            lineHeight: '1.6',
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Brain className="w-3 h-3" /> Core Concepts
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[56px]">
                  {(watch('core_concepts') || []).map((concept: string) => (
                    <span key={concept} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 shadow-sm">
                      {concept}
                      <button 
                        type="button" 
                        onClick={() => {
                          const current = watch('core_concepts') || [];
                          setValue('core_concepts', current.filter((c: string) => c !== concept));
                        }} 
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          const current = watch('core_concepts') || [];
                          if (!current.includes(val)) {
                            setValue('core_concepts', [...current, val]);
                          }
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 min-w-[150px] px-2"
                    placeholder="Add core concepts..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TagIcon className="w-3 h-3" /> Tags
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[56px]">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 shadow-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="flex-1 bg-transparent outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 min-w-[150px] px-2"
                    placeholder="Add tags..."
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3" /> Source URL
                  </label>
                  <input
                    {...register('source_url')}
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    placeholder="https://docs.example.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Version / Environment
                  </label>
                  <input
                    {...register('version_info')}
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    placeholder="e.g., React 18, Python 3.10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Prerequisites
                  </label>
                  <input
                    {...register('prerequisites')}
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    placeholder="e.g., Knowledge of Recursion"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Timer className="w-3 h-3" /> Learning Time
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      {...register('learning_time')}
                      className="flex-1 px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      placeholder="e.g., 30 mins"
                    />
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1.5">
                      {['15m', '30m', '1h', '2h'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setValue('learning_time', t)}
                          className="px-3 py-1.5 text-[10px] font-black hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Code className="w-3 h-3" /> Usage Example
                </label>
                <textarea
                  {...register('usage_example')}
                  className="w-full px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-zinc-50/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 resize-none h-32 text-sm font-mono text-zinc-900 dark:text-zinc-100"
                  placeholder="How to use this code..."
                />
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 space-y-4">
                  <label className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Expert Tips & Best Practices
                  </label>
                  <textarea
                    {...register('expert_tips')}
                    className="w-full px-5 py-4 rounded-2xl border border-amber-200 dark:border-amber-800 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-40 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-amber-300 dark:placeholder:text-amber-800"
                    placeholder="What to avoid, why this implementation is preferred, common pitfalls..."
                  />
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg text-[9px] font-bold uppercase">Performance</span>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg text-[9px] font-bold uppercase">Security</span>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg text-[9px] font-bold uppercase">Readability</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Best Practices
                    </label>
                    <textarea
                      {...register('best_practices')}
                      className="w-full px-5 py-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-800"
                      placeholder="Always use strict equality, avoid global variables..."
                    />
                  </div>
                  <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 space-y-4">
                    <label className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Common Pitfalls
                    </label>
                    <textarea
                      {...register('common_pitfalls')}
                      className="w-full px-5 py-4 rounded-2xl border border-red-200 dark:border-red-800 focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-red-300 dark:placeholder:text-red-800"
                      placeholder="Don't forget to close the connection, beware of off-by-one errors..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Performance Notes
                    </label>
                    <textarea
                      {...register('performance_notes')}
                      className="w-full px-5 py-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-800"
                      placeholder="Time Complexity: O(n log n)..."
                    />
                  </div>
                  <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 space-y-4">
                    <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5" /> Test Cases
                    </label>
                    <textarea
                      {...register('test_cases')}
                      className="w-full px-5 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-emerald-300 dark:placeholder:text-emerald-800"
                      placeholder="Input: [1, 2, 3] -> Output: 6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 space-y-4">
                    <label className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Security Implications
                    </label>
                    <textarea
                      {...register('security_implications')}
                      className="w-full px-5 py-4 rounded-2xl border border-rose-200 dark:border-rose-800 focus:border-rose-500 dark:focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-rose-300 dark:placeholder:text-rose-800"
                      placeholder="SQL Injection risks, XSS vulnerabilities..."
                    />
                  </div>
                  <div className="p-6 rounded-3xl bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30 space-y-4">
                    <label className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Scalability Notes
                    </label>
                    <textarea
                      {...register('scalability_notes')}
                      className="w-full px-5 py-4 rounded-2xl border border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-cyan-300 dark:placeholder:text-cyan-800"
                      placeholder="Horizontal scaling, caching strategies..."
                    />
                  </div>
                </div>

                  <div className="p-6 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Self Rating (1-10)
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        {...register('rating')}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 w-8 text-center">{watch('rating')}</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 space-y-4">
                    <label className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Refactoring Suggestions
                    </label>
                    <textarea
                      {...register('refactoring_suggestions')}
                      className="w-full px-5 py-4 rounded-2xl border border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-purple-300 dark:placeholder:text-purple-800"
                      placeholder="Ideas for future improvements..."
                    />
                  </div>

                  <div className="p-6 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Trade-offs
                    </label>
                  <textarea
                    {...register('trade_offs')}
                    className="w-full px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-zinc-500 dark:focus:border-zinc-400 focus:ring-4 focus:ring-zinc-500/10 outline-none transition-all bg-white dark:bg-zinc-900 resize-none h-32 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                    placeholder="Memory vs Speed, Complexity vs Maintainability..."
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 flex justify-end gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            Discard
          </button>
          <button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="px-8 py-3 rounded-2xl text-sm font-black bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Snippet
          </button>
        </div>
      </motion.div>
    </div>
  );
}
