import React, { useState, useEffect, useRef } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { X, Book } from 'lucide-react';

interface LibrarySelectorProps {
  selectedLibraries: string[];
  onChange: (libraries: string[]) => void;
}

export default function LibrarySelector({ selectedLibraries, onChange }: LibrarySelectorProps) {
  const { libraries } = useSnippets();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (input.trim()) {
      const filtered = libraries
        .map(l => l.name)
        .filter(name => 
          name.toLowerCase().includes(input.toLowerCase()) && 
          !selectedLibraries.includes(name)
        );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, libraries, selectedLibraries]);

  const addLibrary = (name: string) => {
    if (!selectedLibraries.includes(name)) {
      onChange([...selectedLibraries, name]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeLibrary = (name: string) => {
    onChange(selectedLibraries.filter(l => l !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        addLibrary(input.trim());
      }
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLibraries.map(lib => (
          <span key={lib} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium flex items-center gap-1">
            <Book className="w-3 h-3" />
            {lib}
            <button onClick={() => removeLibrary(lib)} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim() && setShowSuggestions(true)}
          placeholder="Add library (e.g. React, Lodash)..."
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                onClick={() => addLibrary(suggestion)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <Book className="w-3 h-3 text-zinc-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
