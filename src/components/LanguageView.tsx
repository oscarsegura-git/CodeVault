import React, { useState } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { Code, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SnippetCard from './SnippetCard';
import { cn } from '../lib/utils';

export default function LanguageView() {
  const [viewMode, setViewMode] = useState<'languages' | 'libraries'>('languages');
  const { snippets, libraries } = useSnippets();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Group snippets by language
  const languageGroups = snippets.reduce((acc, snippet) => {
    const langLower = snippet.language.toLowerCase().trim();
    if (!acc[langLower]) {
      acc[langLower] = {
        name: snippet.language.trim(),
        count: 0,
        originalNames: new Set<string>()
      };
    }
    acc[langLower].count++;
    acc[langLower].originalNames.add(snippet.language);
    return acc;
  }, {} as Record<string, { name: string; count: number; originalNames: Set<string> }>);

  // Group snippets by library
  const libraryGroups = snippets.reduce((acc, snippet) => {
    if (snippet.libraries && snippet.libraries.length > 0) {
      snippet.libraries.forEach(lib => {
        const libLower = lib.toLowerCase().trim();
        if (!acc[libLower]) {
          acc[libLower] = {
            name: lib.trim(),
            count: 0,
            originalNames: new Set<string>()
          };
        }
        acc[libLower].count++;
        acc[libLower].originalNames.add(lib);
      });
    }
    return acc;
  }, {} as Record<string, { name: string; count: number; originalNames: Set<string> }>);

  const languageStats = Object.values(languageGroups).map((group: { name: string; count: number; originalNames: Set<string> }) => {
    // Normalize display name: Title Case or specific overrides
    const lower = group.name.toLowerCase();
    let displayName = group.name;
    
    const overrides: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'php': 'PHP',
      'json': 'JSON',
      'python': 'Python',
      'markdown': 'Markdown'
    };
    
    if (overrides[lower]) {
      displayName = overrides[lower];
    } else {
      displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    return {
      name: displayName,
      count: group.count,
      matches: (lang: string) => lang.toLowerCase().trim() === lower
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const libraryStats = Object.values(libraryGroups).map((group: { name: string; count: number; originalNames: Set<string> }) => {
    return {
      name: group.name,
      count: group.count,
      matches: (lib: string) => lib.toLowerCase().trim() === group.name.toLowerCase().trim()
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const filteredLanguages = languageStats.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLibraries = libraryStats.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedLanguage) {
    // Find the group for the selected language
    const selectedGroup = languageStats.find(l => l.name === selectedLanguage);
    const languageSnippets = snippets.filter(s => 
      selectedGroup ? selectedGroup.matches(s.language) : s.language === selectedLanguage
    );
    
    // Group by library
    const libraryGroups: Record<string, typeof languageSnippets> = {};
    const noLibrarySnippets: typeof languageSnippets = [];

    languageSnippets.forEach(s => {
      if (s.libraries && s.libraries.length > 0) {
        s.libraries.forEach((lib: string) => {
          if (!libraryGroups[lib]) libraryGroups[lib] = [];
          if (!libraryGroups[lib].find((existing: any) => existing.id === s.id)) {
             libraryGroups[lib].push(s);
          }
        });
      } else {
        noLibrarySnippets.push(s);
      }
    });
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setSelectedLanguage(null)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedLanguage}</h2>
            <p className="text-sm text-zinc-500">{languageSnippets.length} snippets in this language</p>
          </div>
        </div>

        {Object.entries(libraryGroups).map(([lib, libSnippets]) => (
          <div key={lib} className="mb-10">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                {lib}
              </span>
              <span className="text-zinc-400 text-xs font-medium">({libSnippets.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {libSnippets.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          </div>
        ))}

        {noLibrarySnippets.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <span className="text-zinc-500">Other / No Library</span>
              <span className="text-zinc-400 text-xs font-medium">({noLibrarySnippets.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {noLibrarySnippets.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  if (selectedLibrary) {
    const selectedGroup = libraryStats.find(l => l.name === selectedLibrary);
    const librarySnippets = snippets.filter(s => 
      s.libraries && s.libraries.some(lib => selectedGroup ? selectedGroup.matches(lib) : lib === selectedLibrary)
    );

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setSelectedLibrary(null)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedLibrary}</h2>
            <p className="text-sm text-zinc-500">{librarySnippets.length} snippets in this library</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {librarySnippets.map(snippet => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
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
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Languages & Libraries</h2>
          <p className="text-zinc-500 text-sm">Explore your library by programming language or library.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setViewMode('languages')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'languages' 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              )}
            >
              Languages
            </button>
            <button
              onClick={() => setViewMode('libraries')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'libraries' 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              )}
            >
              Libraries
            </button>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder={`Search ${viewMode}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
            />
          </div>
        </div>
      </div>

      {viewMode === 'languages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLanguages.map(lang => (
            <motion.div 
              key={lang.name}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedLanguage(lang.name)}
              className="group bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{lang.name}</h3>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{lang.count} Snippets</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </motion.div>
          ))}
          {filteredLanguages.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-zinc-400">No languages found matching your search.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLibraries.map(lib => (
            <motion.div 
              key={lib.name}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedLibrary(lib.name)}
              className="group bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{lib.name}</h3>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{lib.count} Snippets</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </motion.div>
          ))}
          {filteredLibraries.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-zinc-400">No libraries found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
