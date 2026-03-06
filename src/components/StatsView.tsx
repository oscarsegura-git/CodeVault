import { useState } from 'react';
import { useSnippets } from '../context/SnippetContext';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BookOpen, Code, FileCode, Trophy, Zap, Activity, Target, Book, Calendar } from 'lucide-react';

export default function StatsView() {
  const { snippets: allSnippets, definitions: allDefinitions, projects, files, challenges: allChallenges } = useSnippets();
  const [timeFilter, setTimeFilter] = useState<'all' | '30days' | 'year'>('all');

  const filterByTime = (timestamp: number) => {
    if (timeFilter === 'all') return true;
    const now = Date.now();
    const diff = now - timestamp;
    if (timeFilter === '30days') return diff <= 30 * 24 * 60 * 60 * 1000;
    if (timeFilter === 'year') return diff <= 365 * 24 * 60 * 60 * 1000;
    return true;
  };

  const snippets = allSnippets.filter(s => filterByTime(s.updated_at));
  const definitions = allDefinitions.filter(d => filterByTime(d.updated_at));
  const challenges = allChallenges.filter(c => filterByTime(c.updated_at));

  // Calculate Glossary Stats
  const totalTerms = definitions.length;
  const masteredTerms = definitions.filter(d => d.learning_status === 'Mastered').length;
  const learningTerms = definitions.filter(d => d.learning_status === 'Learning').length;
  const referenceTerms = definitions.filter(d => d.learning_status === 'Reference').length;

  const termsByLanguage = definitions.reduce((acc, curr) => {
    const lang = curr.language || 'Uncategorized';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const termsByLanguageData = Object.entries(termsByLanguage)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const termsByCategory = definitions.reduce((acc, curr) => {
    const cat = curr.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const termsByCategoryData = Object.entries(termsByCategory)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }))
    .sort((a, b) => b.value - a.value);

  // Calculate Snippet Stats
  const totalSnippets = snippets.length;
  const snippetsByLanguage = snippets.reduce((acc, curr) => {
    const lang = curr.language || 'Text';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const snippetsByComplexity = snippets.reduce((acc, curr) => {
    const comp = curr.complexity || 'Beginner';
    acc[comp] = (acc[comp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const snippetsByLanguageData = Object.entries(snippetsByLanguage)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const snippetsByLibrary = snippets.reduce((acc, curr) => {
    const libs = curr.libraries || [];
    libs.forEach(lib => {
      acc[lib] = (acc[lib] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const snippetsByLibraryData = Object.entries(snippetsByLibrary)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calculate Glossary Stats
  const termsByComplexity = definitions.reduce((acc, curr) => {
    const comp = curr.complexity || 'Beginner';
    acc[comp] = (acc[comp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate Challenges Stats
  const totalChallenges = challenges.length;
  const challengesByDifficulty = challenges.reduce((acc, curr) => {
    const diff = curr.difficulty || 'Beginner';
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const challengesByDifficultyData = Object.entries(challengesByDifficulty)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }));

  const completedChallenges = challenges.filter(c => c.status === 'Completed').length;
  const inProgressChallenges = challenges.filter(c => c.status === 'In Progress').length;
  const todoChallenges = challenges.filter(c => c.status === 'Todo').length;

  const challengesByLanguage = challenges.reduce((acc, curr) => {
    const lang = curr.language || 'Uncategorized';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const challengesByLanguageData = Object.entries(challengesByLanguage)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calculate Snippets by Tag
  const snippetsByTag = snippets.reduce((acc, curr) => {
    const tags = curr.tags || [];
    tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const snippetsByTagData = Object.entries(snippetsByTag)
    .map(([name, value]) => ({ name, value } as { name: string, value: number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Calculate Total Points
  const totalPoints = challenges.reduce((acc, curr) => {
    if (curr.status === 'Completed') {
      return acc + (curr.points || 0);
    }
    return acc;
  }, 0);

  // Activity (Mock data for now as we don't have full history, but we can use updated_at)
  // Group by day for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const activityData = last7Days.map(date => {
    const dayStart = new Date(date).setHours(0,0,0,0);
    const dayEnd = new Date(date).setHours(23,59,59,999);
    
    const snippetCount = snippets.filter(s => s.updated_at >= dayStart && s.updated_at <= dayEnd).length;
    const termCount = definitions.filter(d => d.updated_at >= dayStart && d.updated_at <= dayEnd).length;
    const challengeCount = challenges.filter(c => c.updated_at >= dayStart && c.updated_at <= dayEnd).length;
    
    return {
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      snippets: snippetCount,
      terms: termCount,
      challenges: challengeCount
    };
  });

  // Calculate Average Snippet Length
  const avgSnippetLength = totalSnippets > 0 
    ? Math.round(snippets.reduce((acc, curr) => acc + (curr.code?.split('\n').length || 0), 0) / totalSnippets)
    : 0;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">Statistics</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track your learning progress and vault growth.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'all' 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFilter('year')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'year' 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Past Year
          </button>
          <button
            onClick={() => setTimeFilter('30days')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeFilter === '30days' 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Snippets</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalSnippets}</div>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Avg Length</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{avgSnippetLength} <span className="text-xs text-zinc-400 font-normal">lines</span></div>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Glossary Terms</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalTerms}</div>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${(masteredTerms / (totalTerms || 1)) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(learningTerms / (totalTerms || 1)) * 100}%` }} />
            <div className="bg-zinc-400 h-full" style={{ width: `${(referenceTerms / (totalTerms || 1)) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400 uppercase">
            <span className="text-emerald-500">{masteredTerms} Mastered</span>
            <span className="text-amber-500">{learningTerms} Learning</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total XP</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalPoints}</div>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-yellow-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Projects</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{projects.length}</div>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Challenges</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalChallenges}</div>
            </div>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${(completedChallenges / (totalChallenges || 1)) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(inProgressChallenges / (totalChallenges || 1)) * 100}%` }} />
            <div className="bg-zinc-400 h-full" style={{ width: `${(todoChallenges / (totalChallenges || 1)) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400 uppercase">
            <span className="text-emerald-500">{completedChallenges} Done</span>
            <span className="text-amber-500">{inProgressChallenges} Doing</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Weekly Activity
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="snippets" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Snippets" />
                <Line type="monotone" dataKey="terms" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Terms" />
                <Line type="monotone" dataKey="challenges" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Challenges" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Glossary by Language */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Glossary Distribution (Top 5 Languages)
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={termsByLanguageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {termsByLanguageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Glossary by Category */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            Glossary by Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termsByCategoryData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Terms" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Snippets by Language */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-500" />
            Snippets by Language
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snippetsByLanguageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} name="Snippets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Snippets by Library */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-500" />
            Snippets by Library
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={snippetsByLibraryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {snippetsByLibraryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Challenges by Language */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Challenges by Language
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={challengesByLanguageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {challengesByLanguageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      {/* Charts Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Snippets by Complexity */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Snippets by Complexity
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(snippetsByComplexity).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(snippetsByComplexity).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Glossary by Complexity */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Book className="w-5 h-5 text-emerald-500" />
            Glossary by Complexity
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(termsByComplexity).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(termsByComplexity).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Challenges by Difficulty */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Challenges by Difficulty
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={challengesByDifficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} name="Challenges" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Snippets by Tag */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-500" />
            Snippets by Tag (Top 10)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snippetsByTagData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} name="Snippets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
