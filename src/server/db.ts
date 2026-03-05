import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'codevault.db'));

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDb() {
  // Snippets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      description TEXT,
      is_favorite INTEGER DEFAULT 0,
      complexity TEXT DEFAULT 'Intermediate',
      learning_status TEXT DEFAULT 'Learning',
      source_url TEXT,
      performance_notes TEXT,
      version_info TEXT,
      expert_tips TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_reviewed_at INTEGER
    )
  `);

  // Migration: Add missing columns to snippets if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(snippets)").all() as any[];
  const columns = tableInfo.map(col => col.name);

  const missingColumns = [
    { name: 'complexity', type: "TEXT DEFAULT 'Intermediate'" },
    { name: 'learning_status', type: "TEXT DEFAULT 'Learning'" },
    { name: 'source_url', type: 'TEXT' },
    { name: 'performance_notes', type: 'TEXT' },
    { name: 'version_info', type: 'TEXT' },
    { name: 'expert_tips', type: 'TEXT' },
    { name: 'last_reviewed_at', type: 'INTEGER' },
    { name: 'prerequisites', type: 'TEXT' },
    { name: 'usage_example', type: 'TEXT' },
    { name: 'test_cases', type: 'TEXT' },
    { name: 'learning_time', type: 'TEXT' },
    { name: 'best_practices', type: 'TEXT' },
    { name: 'common_pitfalls', type: 'TEXT' }
  ];

  for (const col of missingColumns) {
    if (!columns.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE snippets ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Migration: Added column ${col.name} to snippets table`);
      } catch (err) {
        console.error(`Migration failed for column ${col.name}:`, err);
      }
    }
  }

  // Collections table (Roadmaps/Learning Paths)
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Snippet Collections junction
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_collections (
      snippet_id TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      PRIMARY KEY (snippet_id, collection_id),
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    )
  `);

  // Related Snippets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS related_snippets (
      snippet_id TEXT NOT NULL,
      related_id TEXT NOT NULL,
      PRIMARY KEY (snippet_id, related_id),
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (related_id) REFERENCES snippets(id) ON DELETE CASCADE
    )
  `);

  // Tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Snippet Tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_tags (
      snippet_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (snippet_id, tag_id),
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
  
  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      content TEXT,
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Snippet Parts table (for multiple code blocks in one snippet)
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_parts (
      id TEXT PRIMARY KEY,
      snippet_id TEXT NOT NULL,
      title TEXT,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add project_id to snippets
  const snippetCols = db.prepare("PRAGMA table_info(snippets)").all() as any[];
  if (!snippetCols.map(c => c.name).includes('project_id')) {
    db.exec(`ALTER TABLE snippets ADD COLUMN project_id TEXT`);
  }

  // Migration: Add content and status columns to projects
  const projectCols = db.prepare("PRAGMA table_info(projects)").all() as any[];
  const projectColNames = projectCols.map(c => c.name);
  if (!projectColNames.includes('content')) {
    db.exec(`ALTER TABLE projects ADD COLUMN content TEXT`);
  }
  if (!projectColNames.includes('status')) {
    db.exec(`ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'active'`);
  }
  if (!projectColNames.includes('priority')) {
    db.exec(`ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'Medium'`);
  }
  if (!projectColNames.includes('deadline')) {
    db.exec(`ALTER TABLE projects ADD COLUMN deadline INTEGER`);
  }

  // Files table (for full code files)
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Definitions table (for glossary)
  db.exec(`
    CREATE TABLE IF NOT EXISTS definitions (
      id TEXT PRIMARY KEY,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      complexity TEXT DEFAULT 'Beginner',
      learning_status TEXT DEFAULT 'Learning',
      language TEXT,
      example TEXT,
      related_terms TEXT,
      "references" TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Migration: Add missing columns to definitions if they don't exist
  const defTableInfo = db.prepare("PRAGMA table_info(definitions)").all() as any[];
  const defColumns = defTableInfo.map(col => col.name);
  const missingDefColumns = [
    { name: 'category', type: "TEXT DEFAULT 'General'" },
    { name: 'complexity', type: "TEXT DEFAULT 'Beginner'" },
    { name: 'learning_status', type: "TEXT DEFAULT 'Learning'" },
    { name: 'related_terms', type: 'TEXT' },
    { name: '"references"', type: 'TEXT' },
    { name: 'tags', type: 'TEXT' }
  ];

  for (const col of missingDefColumns) {
    // Clean name for checking existence
    const cleanName = col.name.replace(/"/g, '');
    if (!defColumns.includes(cleanName)) {
      try {
        db.exec(`ALTER TABLE definitions ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Migration: Added column ${col.name} to definitions table`);
      } catch (err) {
        console.error(`Migration failed for column ${col.name}:`, err);
      }
    }
  }

  // Migration: Add deleted_at to snippets, files, definitions, collections, projects
  const tablesToUpdate = ['snippets', 'files', 'definitions', 'collections', 'projects'];
  for (const table of tablesToUpdate) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!info.map(c => c.name).includes('deleted_at')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at INTEGER`);
    }
  }

  // Libraries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS libraries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Snippet Libraries junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_libraries (
      snippet_id TEXT NOT NULL,
      library_id TEXT NOT NULL,
      PRIMARY KEY (snippet_id, library_id),
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    )
  `);

  // Project Libraries junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_libraries (
      project_id TEXT NOT NULL,
      library_id TEXT NOT NULL,
      PRIMARY KEY (project_id, library_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    )
  `);

  // File Libraries junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_libraries (
      file_id TEXT NOT NULL,
      library_id TEXT NOT NULL,
      PRIMARY KEY (file_id, library_id),
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add libraries column to definitions
  const defTableInfoLibraries = db.prepare("PRAGMA table_info(definitions)").all() as any[];
  const defColumnsLibraries = defTableInfoLibraries.map(col => col.name);
  if (!defColumnsLibraries.includes('libraries')) {
    db.exec(`ALTER TABLE definitions ADD COLUMN libraries TEXT`);
  }

  // Security table
  db.exec(`
    CREATE TABLE IF NOT EXISTS security (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  console.log('Database initialized');
}

export default db;
