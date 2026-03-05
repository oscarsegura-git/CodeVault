import React, { useState, useEffect } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { useConfirm } from '../context/ConfirmContext';
import { Snippet } from '../types';
import { Copy, Trash2, Edit2, Star, Calendar, Tag, Maximize2, X, Zap, AlertCircle, Link as LinkIcon, CheckCircle, BookOpen, FlaskConical, Timer, Folder, Code, CopyPlus, Briefcase, Download, Brain, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SnippetCard({ snippet, onEdit }: any) {
  const { updateSnippet, deleteSnippet, collections, projects, addSnippet, settings, toggleFavorite: toggleFavoriteContext } = useSnippets();
  const { confirm } = useConfirm();
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const projectName = projects.find(p => p.id === snippet.project_id)?.name;
  const folderName = collections.find(c => c.id === snippet.collection_id)?.name;

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { id, created_at, updated_at, last_reviewed_at, ...rest } = snippet;
    addSnippet({ ...rest, title: `${snippet.title} (Copy)` });
  };

  const downloadSnippet = (e: React.MouseEvent) => {
    e.stopPropagation();
    const extensions: Record<string, string> = {
      'JavaScript': 'js', 'TypeScript': 'ts', 'Python': 'py', 'HTML': 'html',
      'CSS': 'css', 'JSON': 'json', 'Bash': 'sh', 'SQL': 'sql', 'Markdown': 'md'
    };
    const ext = extensions[snippet.language] || 'txt';
    
    let fullCode = snippet.code;
    if (snippet.parts && snippet.parts.length > 0) {
      snippet.parts.forEach((part: any) => {
        fullCode += `\n\n/* --- ${part.title || 'Additional Part'} --- */\n\n${part.code}`;
      });
    }

    const blob = new Blob([fullCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snippet.title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFavorite = (e: any) => {
    e.stopPropagation();
    toggleFavoriteContext(snippet.id);
  };

  const handleReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSnippet(snippet.id, { ...snippet, last_reviewed_at: Date.now() });
  };

  const statusColors = {
    'Learning': 'bg-blue-50 text-blue-600 border-blue-100',
    'Mastered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Reference': 'bg-zinc-50 text-zinc-600 border-zinc-100'
  };

  const complexityColors = {
    'Beginner': 'text-emerald-500',
    'Intermediate': 'text-amber-500',
    'Advanced': 'text-rose-500'
  };

  return (
    <>
      <motion.div 
        layoutId={`card-${snippet.id}`}
        className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
      >
        <div className={cn(
          "flex flex-col h-full",
          settings.compactMode ? "p-4" : "p-6"
        )}>
          <div className={cn(
            "flex justify-between items-start",
            settings.compactMode ? "mb-2" : "mb-4"
          )}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                  {snippet.language}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                  statusColors[snippet.learning_status as keyof typeof statusColors]
                )}>
                  {snippet.learning_status}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  complexityColors[snippet.complexity as keyof typeof complexityColors]
                )}>
                  {snippet.complexity}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{snippet.title}</h3>
            </div>
            <button 
              onClick={toggleFavorite}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                snippet.is_favorite ? "text-amber-400 bg-amber-50 dark:bg-amber-900/20" : "text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Star className={cn("w-4 h-4", snippet.is_favorite && "fill-current")} />
            </button>
          </div>

          <div className="relative group/code flex-grow mb-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
              <button 
                onClick={() => handleCopy(snippet.code)}
                className="p-1.5 bg-zinc-800 rounded-md shadow-sm border border-zinc-700 text-zinc-400 hover:text-white"
                title="Copy code"
              >
                {copied ? <span className="text-[10px] font-bold text-emerald-400 px-1">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsExpanded(true)}
                className="p-1.5 bg-zinc-800 rounded-md shadow-sm border border-zinc-700 text-zinc-400 hover:text-white"
                title="Expand"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] max-h-40 overflow-hidden pointer-events-none select-none">
               <SyntaxHighlighter 
                language={snippet.language.toLowerCase()} 
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                wrapLines={true}
              >
                {snippet.code}
              </SyntaxHighlighter>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>

          <div className="mt-auto">
            {snippet.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
                {snippet.description}
              </p>
            )}
             <div className="flex flex-wrap gap-1.5 mb-4">
              {snippet.libraries && snippet.libraries.length > 0 && (
                 <div className="flex flex-wrap gap-1.5 mr-2 border-r border-zinc-200 dark:border-zinc-800 pr-2">
                   {snippet.libraries.map((lib: string) => (
                     <span key={lib} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                       <BookOpen className="w-3 h-3" />
                       {lib}
                     </span>
                   ))}
                 </div>
              )}
              {snippet.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleReview}
                  className="text-[10px] font-bold text-zinc-400 hover:text-emerald-600 flex items-center gap-1.5 transition-colors"
                  title="Mark as Reviewed"
                >
                  <CheckCircle className={cn("w-3.5 h-3.5", snippet.last_reviewed_at && "text-emerald-500")} />
                  {snippet.last_reviewed_at ? format(snippet.last_reviewed_at, 'MMM d') : 'Review'}
                </button>
                <button 
                  onClick={() => onEdit(snippet)}
                  className="text-[10px] font-bold text-zinc-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button 
                  onClick={handleDuplicate}
                  className="text-[10px] font-bold text-zinc-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                  title="Duplicate Snippet"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                  Duplicate
                </button>
                <button 
                  onClick={downloadSnippet}
                  className="text-[10px] font-bold text-zinc-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                  title="Download Snippet"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    const confirmed = await confirm({
                      title: 'Delete Snippet',
                      message: 'Are you sure you want to delete this snippet? It will be moved to trash.',
                      isDestructive: true,
                      confirmText: 'Delete'
                    });
                    if (confirmed) {
                      deleteSnippet(snippet.id);
                    }
                  }}
                  className="text-[10px] font-bold flex items-center gap-1.5 transition-all ml-auto px-2 py-1 rounded text-zinc-400 hover:text-red-600"
                  title="Delete Snippet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Borrar
                </button>
              </div>
              <span className="text-[10px] font-medium text-zinc-400">
                {format(snippet.updated_at, 'MMM d')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div 
              layoutId={`card-${snippet.id}`}
              className="bg-white dark:bg-zinc-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
                <div className="flex items-center gap-4">
                  <h2 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">{snippet.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                      {snippet.language}
                    </span>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                      statusColors[snippet.learning_status as keyof typeof statusColors]
                    )}>
                      {snippet.learning_status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCopy(snippet.code)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                  <button 
                    onClick={downloadSnippet}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 overflow-auto bg-zinc-950 border-r border-zinc-800 scrollbar-hide">
                  <div className="p-8 space-y-12">
                    {/* Main Code Block */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Code className="w-3.5 h-3.5" /> Main Implementation
                        </h4>
                        <button 
                          onClick={() => handleCopy(snippet.code)}
                          className="text-[10px] font-black text-zinc-500 hover:text-white transition-colors"
                        >
                          COPY
                        </button>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-zinc-800">
                        <SyntaxHighlighter 
                          language={snippet.language.toLowerCase()} 
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', background: 'transparent' }}
                          showLineNumbers={true}
                        >
                          {snippet.code}
                        </SyntaxHighlighter>
                      </div>
                    </section>

                    {/* Additional Parts */}
                    {snippet.parts && snippet.parts.length > 0 && (
                      <div className="space-y-12">
                        {snippet.parts.map((part: any, idx: number) => (
                          <section key={idx}>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Code className="w-3.5 h-3.5" /> {part.title || `Block ${idx + 1}`}
                              </h4>
                              <button 
                                onClick={() => handleCopy(part.code)}
                                className="text-[10px] font-black text-zinc-500 hover:text-white transition-colors"
                              >
                                COPY
                              </button>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-zinc-800">
                              <SyntaxHighlighter 
                                language={(part.language || snippet.language).toLowerCase()} 
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '1.5rem', fontSize: '13px', background: 'transparent' }}
                                showLineNumbers={true}
                              >
                                {part.code}
                              </SyntaxHighlighter>
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-80 overflow-y-auto p-6 bg-white dark:bg-zinc-900 space-y-8">
                  {snippet.description && (
                    <section>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{snippet.description}</p>
                    </section>
                  )}

                  {snippet.prerequisites && (
                    <section>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-zinc-400" /> Prerequisites
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{snippet.prerequisites}</p>
                    </section>
                  )}

                  {snippet.usage_example && (
                    <section>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Code className="w-3 h-3 text-zinc-400" /> Usage Example
                      </h4>
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3">
                        <pre className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono overflow-x-auto">{snippet.usage_example}</pre>
                      </div>
                    </section>
                  )}

                  {snippet.test_cases && (
                    <section>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FlaskConical className="w-3 h-3 text-zinc-400" /> Test Cases
                      </h4>
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3">
                        <pre className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono overflow-x-auto">{snippet.test_cases}</pre>
                      </div>
                    </section>
                  )}

                  {(snippet.performance_notes || snippet.best_practices || snippet.common_pitfalls || snippet.expert_tips) && (
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Expert Notes</h4>
                        <button 
                          onClick={() => {
                            const notes = [
                              snippet.expert_tips ? `Expert Tips: ${snippet.expert_tips}` : '',
                              snippet.performance_notes ? `Performance: ${snippet.performance_notes}` : '',
                              snippet.best_practices ? `Best Practices: ${snippet.best_practices}` : '',
                              snippet.common_pitfalls ? `Common Pitfalls: ${snippet.common_pitfalls}` : ''
                            ].filter(Boolean).join('\n\n');
                            navigator.clipboard.writeText(notes);
                            showMessage('Expert notes copied');
                          }}
                          className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                        >
                          <Copy className="w-3 h-3" /> COPY ALL
                        </button>
                      </div>

                      {snippet.performance_notes && (
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-500" /> Performance
                          </h4>
                          <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3">
                            <p className="text-xs text-amber-900 dark:text-amber-400 font-mono leading-relaxed">{snippet.performance_notes}</p>
                          </div>
                        </section>
                      )}

                      {snippet.best_practices && (
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Best Practices
                          </h4>
                          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3">
                            <p className="text-xs text-emerald-900 dark:text-emerald-400 leading-relaxed">{snippet.best_practices}</p>
                          </div>
                        </section>
                      )}

                      {snippet.common_pitfalls && (
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-red-500" /> Common Pitfalls
                          </h4>
                          <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
                            <p className="text-xs text-red-900 dark:text-red-400 leading-relaxed">{snippet.common_pitfalls}</p>
                          </div>
                        </section>
                      )}

                      {snippet.expert_tips && (
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Brain className="w-3 h-3 text-indigo-500" /> Expert Tips
                          </h4>
                          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3">
                            <p className="text-xs text-indigo-900 dark:text-indigo-400 leading-relaxed italic">"{snippet.expert_tips}"</p>
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  <section>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Metadata</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Complexity</span>
                        <span className={cn("font-bold", complexityColors[snippet.complexity as keyof typeof complexityColors])}>
                          {snippet.complexity}
                        </span>
                      </div>
                      {snippet.project_id && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Project</span>
                          <span className="text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {projectName || 'Unknown'}
                          </span>
                        </div>
                      )}
                      {snippet.collection_id && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Folder</span>
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {folderName || 'Unknown'}
                          </span>
                        </div>
                      )}
                      {snippet.version_info && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Environment</span>
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium">{snippet.version_info}</span>
                        </div>
                      )}
                      {snippet.learning_time && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Learning Time</span>
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium">{snippet.learning_time}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Created</span>
                        <span className="text-zinc-600 dark:text-zinc-400">{format(snippet.created_at, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </section>

                  {snippet.source_url && (
                    <section>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Reference</h4>
                      <a 
                        href={snippet.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1.5 break-all"
                      >
                        <LinkIcon className="w-3 h-3" />
                        Original Source
                      </a>
                    </section>
                  )}

                  <section className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Organization</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-medium text-zinc-500">Project</span>
                        <select 
                          value={snippet.project_id || ''}
                          onChange={(e) => updateSnippet(snippet.id, { ...snippet, project_id: e.target.value || null })}
                          className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-zinc-500/10 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">None</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-medium text-zinc-500">Folder</span>
                        <select 
                          value={snippet.collection_id || ''}
                          onChange={(e) => updateSnippet(snippet.id, { ...snippet, collection_id: e.target.value || null })}
                          className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-zinc-500/10 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">None</option>
                          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl shadow-2xl z-[100] text-xs font-bold flex items-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
