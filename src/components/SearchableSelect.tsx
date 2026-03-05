import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
  maxVisible?: number;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  multiple = false,
  className,
  maxVisible = 5
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const removeValue = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(v => v !== valToRemove));
    } else {
      onChange('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map(val => {
            const opt = options.find(o => o.value === val);
            return (
              <span key={val} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                {opt?.label || val}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-100" 
                  onMouseDown={(e) => removeValue(e, val)}
                />
              </span>
            );
          })}
        </div>
      );
    }
    
    if (!multiple && value) {
      const opt = options.find(o => o.value === value);
      return <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{opt?.label || value}</span>;
    }

    return <span className="text-sm text-zinc-400">{placeholder}</span>;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer flex items-center justify-between min-h-[42px] focus:ring-2 focus:ring-indigo-500/20 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {getDisplayValue()}
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input 
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-xs w-full text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-zinc-400 text-center">No results found</div>
              ) : (
                filteredOptions.map(opt => {
                  const isSelected = multiple 
                    ? Array.isArray(value) && value.includes(opt.value)
                    : value === opt.value;
                  
                  return (
                    <div 
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between transition-colors",
                        isSelected 
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold" 
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      {opt.label}
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
