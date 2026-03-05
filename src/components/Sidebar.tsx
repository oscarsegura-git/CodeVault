import React from 'react';
import { useSnippets } from '../context/SnippetContext';
import { 
  Plus, Search, Code2, Hash, Star, LayoutGrid, List as ListIcon, 
  Settings, X, FolderKanban, BarChart3, Folder, Trash2, Edit3, Check,
  Briefcase, Code, FileCode, BookOpen, ChevronDown, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { 
    filter, setFilter, tags, libraries, settings
  } = useSnippets();
  const [hash, setHash] = React.useState(window.location.hash);
  const [tagSearch, setTagSearch] = React.useState('');
  const [tagsExpanded, setTagsExpanded] = React.useState(true);
  const [librariesExpanded, setLibrariesExpanded] = React.useState(false);
  const [librarySearch, setLibrarySearch] = React.useState('');

  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavClick = (newHash: string, filterUpdate?: Partial<typeof filter>) => {
    window.location.hash = newHash;
    if (filterUpdate) {
      setFilter({ ...filter, ...filterUpdate });
    } else {
      // Reset filters when navigating to main sections that don't use them
      setFilter({ 
        tag: '', 
        learning_status: '', 
        collection_id: '', 
        project_id: '', 
        favorite: false,
        search: filter.search,
        sortBy: filter.sortBy
      });
    }
  };

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
  
  return (
    <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto scrollbar-hide z-50">
      <div className={cn("flex flex-col h-full", settings.compactMode ? "p-4" : "p-6")}>
        <div className={cn("flex items-center gap-2 cursor-pointer", settings.compactMode ? "mb-4" : "mb-8")} onClick={() => handleNavClick('')}>
          <div className="bg-zinc-900 dark:bg-zinc-100 p-2 rounded-lg">
            <Code2 className="w-5 h-5 text-white dark:text-zinc-900" />
          </div>
          <h1 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">CodeVault</h1>
        </div>

        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-editor'))}
          className={cn(
            "w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm",
            settings.compactMode ? "py-2 px-3 mb-4 text-sm" : "py-2.5 px-4 mb-6"
          )}
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </button>

        <div className="space-y-1">
          <NavItem 
            icon={<LayoutGrid className="w-4 h-4" />} 
            label="All Snippets" 
            active={!hash || hash === '#'}
            onClick={() => handleNavClick('')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<Star className="w-4 h-4" />} 
            label="Favorites" 
            active={hash === '#favorites'}
            onClick={() => handleNavClick('favorites', { favorite: true })}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<Briefcase className="w-4 h-4" />} 
            label="Projects" 
            active={hash.startsWith('#projects')}
            onClick={() => handleNavClick('projects')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<FolderKanban className="w-4 h-4" />} 
            label="Board" 
            active={hash.startsWith('#board')}
            onClick={() => handleNavClick('board')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<Code className="w-4 h-4" />} 
            label="Languages" 
            active={hash.startsWith('#languages')}
            onClick={() => handleNavClick('languages')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<Folder className="w-4 h-4" />} 
            label="Folders" 
            active={hash.startsWith('#folders')}
            onClick={() => handleNavClick('folders')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<FileCode className="w-4 h-4" />} 
            label="Workspace" 
            active={hash.startsWith('#workspace')}
            onClick={() => handleNavClick('workspace')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<Target className="w-4 h-4" />} 
            label="Challenges" 
            active={hash.startsWith('#challenges')}
            onClick={() => handleNavClick('challenges')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<BookOpen className="w-4 h-4" />} 
            label="Glossary" 
            active={hash.startsWith('#glossary')}
            onClick={() => handleNavClick('glossary')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Statistics" 
            active={hash === '#stats'}
            onClick={() => handleNavClick('stats')}
            compact={settings.compactMode}
          />
          <NavItem 
            icon={<Trash2 className="w-4 h-4" />} 
            label="Trash" 
            active={hash === '#trash'}
            onClick={() => handleNavClick('trash')}
            compact={settings.compactMode}
          />
        </div>

        {/* Status Section */}
        <div className={cn("mt-8", settings.compactMode ? "mt-4" : "mt-8")}>
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</h3>
          </div>
          <div className="space-y-1">
            {['Learning', 'Mastered', 'Reference'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter({ ...filter, learning_status: status === filter.learning_status ? '' : status, tag: '', favorite: false, collection_id: '', project_id: '' });
                  if (window.location.hash !== '') window.location.hash = '';
                }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg font-bold transition-all",
                  settings.compactMode ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
                  filter.learning_status === status 
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status === 'Learning' ? "bg-blue-500" : status === 'Mastered' ? "bg-emerald-500" : "bg-zinc-400"
                )} />
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className={cn("mb-8", settings.compactMode ? "mt-4 mb-4" : "mt-8 mb-8")}>
          <div 
            className="flex items-center justify-between mb-3 px-3 cursor-pointer group"
            onClick={() => setTagsExpanded(!tagsExpanded)}
          >
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">Tags</h3>
            <div className={cn("transition-transform duration-200", tagsExpanded ? "rotate-180" : "")}>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
          
          <AnimatePresence>
            {tagsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 mb-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text"
                      placeholder="Find tag..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className={cn(
                        "w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                        settings.compactMode ? "text-[10px]" : "text-xs"
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide px-1">
                  {filteredTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setFilter({ ...filter, tag: tag.name === filter.tag ? '' : tag.name, favorite: false, learning_status: '', collection_id: '', project_id: '' });
                        if (window.location.hash !== '') window.location.hash = '';
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg font-bold transition-all",
                        settings.compactMode ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
                        filter.tag === tag.name 
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 opacity-50" />
                        {tag.name}
                      </div>
                      <span className="text-[9px] opacity-50">{tag.snippet_count}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Libraries Section */}
        <div className={cn("mb-8", settings.compactMode ? "mt-4 mb-4" : "mt-8 mb-8")}>
          <div 
            className="flex items-center justify-between mb-3 px-3 cursor-pointer group"
            onClick={() => setLibrariesExpanded(!librariesExpanded)}
          >
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">Libraries</h3>
            <div className={cn("transition-transform duration-200", librariesExpanded ? "rotate-180" : "")}>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
          
          <AnimatePresence>
            {librariesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 mb-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text"
                      placeholder="Find library..."
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      className={cn(
                        "w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                        settings.compactMode ? "text-[10px]" : "text-xs"
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide px-1">
                  {libraries && libraries.filter(l => l.name.toLowerCase().includes(librarySearch.toLowerCase())).map(lib => (
                    <button
                      key={lib.id}
                      onClick={() => {
                        setFilter({ ...filter, library: lib.name === filter.library ? '' : lib.name, tag: '', favorite: false, learning_status: '', collection_id: '', project_id: '' });
                        if (window.location.hash !== '') window.location.hash = '';
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg font-bold transition-all",
                        settings.compactMode ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
                        filter.library === lib.name 
                          ? "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400" 
                          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 opacity-50" />
                        {lib.name}
                      </div>
                      <span className="text-[9px] opacity-50">{lib.snippet_count}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-200">
          <NavItem 
            icon={<Settings className="w-4 h-4" />} 
            label="Settings" 
            active={hash === '#settings'}
            onClick={() => handleNavClick('settings')}
            compact={settings.compactMode}
          />
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, compact }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg font-medium transition-all relative overflow-hidden group",
        compact ? "px-2.5 py-2 text-xs" : "px-3 py-2.5 text-sm",
        active 
          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" 
          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm -z-10"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className={cn("opacity-70 transition-colors", active && "text-indigo-600 dark:text-indigo-400 opacity-100")}>{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}
