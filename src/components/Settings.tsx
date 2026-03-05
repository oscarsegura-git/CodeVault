import React, { useState } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2, Code, Lock, Shield, Save as SaveIcon, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import SearchableSelect from './SearchableSelect';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'Markdown', 'Shell'];

export default function Settings() {
  const { snippets, refreshSnippets, settings, updateSettings } = useSnippets();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState(0);
  const [resetConfirmation, setResetConfirmation] = useState('');

  const showMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleUpdateSetting = (newSetting: any) => {
    updateSettings(newSetting);
    showMessage('Settings updated');
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", `codevault_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to export data");
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const data = JSON.parse(e.target.result as string);
            const response = await fetch('/api/restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              alert("Data restored successfully!");
              refreshSnippets();
            } else {
              const err = await response.json();
              alert(`Restore failed: ${err.error}`);
            }
          } catch (error) {
            alert("Invalid JSON file or restore failed");
          }
        }
      };
    }
  };

  const handleReset = async () => {
    if (resetStep < 3) {
      setResetStep(prev => prev + 1);
      return;
    }

    if (resetConfirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await fetch('/api/reset', { method: 'DELETE' });
      if (response.ok) {
        localStorage.removeItem('codevault_settings');
        window.location.reload();
      }
    } catch (error) {
      alert("Failed to reset data");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Settings</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          v1.2.0 Stable
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            Appearance
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Default Language</h4>
                <p className="text-xs text-zinc-500">The pre-selected language for new snippets.</p>
              </div>
              <SearchableSelect
                options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                value={settings.defaultLanguage}
                onChange={(val) => handleUpdateSetting({ defaultLanguage: val })}
                placeholder="Select Language"
                className="w-48"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Theme Mode</h4>
                <p className="text-xs text-zinc-500">Choose your preferred visual style.</p>
              </div>
              <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => handleUpdateSetting({ theme: 'light' })}
                  className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2", settings.theme === 'light' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button 
                  onClick={() => handleUpdateSetting({ theme: 'dark' })}
                  className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2", settings.theme === 'dark' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Editor Font Size</h4>
                <p className="text-xs text-zinc-500">Adjust the size of the code text.</p>
              </div>
              <select 
                value={settings.fontSize}
                onChange={(e) => handleUpdateSetting({ fontSize: e.target.value })}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500/20"
              >
                <option value="12px">12px (Small)</option>
                <option value="14px">14px (Default)</option>
                <option value="16px">16px (Large)</option>
                <option value="18px">18px (Extra Large)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Compact Mode</h4>
                <p className="text-xs text-zinc-500">Reduce spacing between elements in the library.</p>
              </div>
              <button 
                onClick={() => handleUpdateSetting({ compactMode: !settings.compactMode })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  settings.compactMode ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                  settings.compactMode ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Security & Automation
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">App Lock</h4>
                <p className="text-xs text-zinc-500">Require a password to access the application.</p>
              </div>
              <div className="flex items-center gap-4">
                {settings.appLock && (
                  <input 
                    type="password"
                    placeholder="Set password..."
                    value={settings.masterPassword || ''}
                    onChange={(e) => handleUpdateSetting({ masterPassword: e.target.value })}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
                <button 
                  onClick={() => handleUpdateSetting({ appLock: !settings.appLock })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    settings.appLock ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.appLock ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Auto-Save</h4>
                <p className="text-xs text-zinc-500">Automatically save changes in the workspace.</p>
              </div>
              <button 
                onClick={() => handleUpdateSetting({ autoSave: !settings.autoSave })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  settings.autoSave ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                  settings.autoSave ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Auto-Backup</h4>
                <p className="text-xs text-zinc-500">Enable periodic local backups (experimental).</p>
              </div>
              <button 
                onClick={() => handleUpdateSetting({ autoBackup: !settings.autoBackup })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  settings.autoBackup ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                  settings.autoBackup ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            Data Management
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Export Library</h4>
              <p className="text-sm text-zinc-500 mb-4">Download a backup of all your snippets and metadata.</p>
              <button 
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Import Library</h4>
              <p className="text-sm text-zinc-500 mb-4">Restore your library from a backup file.</p>
              <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer w-fit">
                <Upload className="w-4 h-4" />
                Import JSON
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Danger Zone
          </h3>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-400">Clear All Data</h4>
                <p className="text-sm text-red-700 dark:text-red-500/70">Permanently delete all snippets, projects, and folders.</p>
              </div>
              {resetStep === 0 && (
                <button 
                  onClick={() => setResetStep(1)}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                >
                  Delete Everything
                </button>
              )}
            </div>

            <AnimatePresence>
              {resetStep > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-red-200 dark:border-red-900/30 space-y-4">
                    {resetStep === 1 && (
                      <div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Step 1/3: Are you absolutely sure?</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">This action will delete all your snippets, projects, and settings. You cannot undo this action.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setResetStep(0)} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold">Cancel</button>
                          <button onClick={() => setResetStep(2)} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold">Yes, continue</button>
                        </div>
                      </div>
                    )}
                    {resetStep === 2 && (
                      <div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Step 2/3: Last Warning!</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">All data will be lost forever unless you have a backup. Are you really sure?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setResetStep(0)} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold">Cancel</button>
                          <button onClick={() => setResetStep(3)} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold">I understand</button>
                        </div>
                      </div>
                    )}
                    {resetStep === 3 && (
                      <div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Step 3/3: Final Confirmation</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">Type <span className="font-mono font-bold select-all">DELETE</span> to confirm.</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={resetConfirmation}
                            onChange={(e) => setResetConfirmation(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-2 focus:ring-red-500/20"
                            placeholder="Type DELETE"
                          />
                          <button 
                            onClick={handleReset} 
                            disabled={resetConfirmation !== 'DELETE'}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirm Delete
                          </button>
                          <button onClick={() => setResetStep(0)} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
      <AnimatePresence>
        {saveMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
