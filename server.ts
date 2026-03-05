import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/server/db';
import db from './src/server/db';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

// Initialize Database
initDb();

// Add folder_id to files if it doesn't exist
try {
  db.prepare('ALTER TABLE files ADD COLUMN folder_id TEXT').run();
} catch (error) {
  // Column likely already exists
}

// Create workspace_folders table
db.prepare(`
  CREATE TABLE IF NOT EXISTS workspace_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    deleted_at INTEGER
  )
`).run();

// Add new columns for Expert Notes
try {
  db.prepare('ALTER TABLE snippets ADD COLUMN rating INTEGER').run();
} catch (error) {}
try {
  db.prepare('ALTER TABLE snippets ADD COLUMN refactoring_suggestions TEXT').run();
} catch (error) {}

// Create challenges table
db.prepare(`
  CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Intermediate',
    status TEXT DEFAULT 'Todo',
    priority TEXT DEFAULT 'Medium',
    link TEXT,
    language TEXT,
    points INTEGER DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER,
    updated_at INTEGER,
    deleted_at INTEGER
  )
`).run();

// Add new columns if they don't exist (for existing DBs)
try {
  db.prepare('ALTER TABLE challenges ADD COLUMN priority TEXT DEFAULT "Medium"').run();
} catch (error) {}
try {
  db.prepare('ALTER TABLE challenges ADD COLUMN link TEXT').run();
} catch (error) {}
try {
  db.prepare('ALTER TABLE challenges ADD COLUMN language TEXT').run();
} catch (error) {}
try {
  db.prepare('ALTER TABLE challenges ADD COLUMN points INTEGER DEFAULT 0').run();
} catch (error) {}
try {
  db.prepare('ALTER TABLE challenges ADD COLUMN completed_at INTEGER').run();
} catch (error) {}

// --- Challenges API ---

app.get('/api/challenges', (req, res) => {
  try {
    const { includeTrash } = req.query;
    const query = includeTrash === 'true'
      ? 'SELECT * FROM challenges WHERE deleted_at IS NOT NULL ORDER BY updated_at DESC'
      : 'SELECT * FROM challenges WHERE deleted_at IS NULL ORDER BY updated_at DESC';
    const challenges = db.prepare(query).all();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

app.post('/api/challenges', (req, res) => {
  try {
    const { title, description, difficulty, status, priority, link, language, points, completed_at } = req.body;
    const id = uuidv4();
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO challenges (id, title, description, difficulty, status, priority, link, language, points, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, title, description, difficulty || 'Intermediate', status || 'Todo', priority || 'Medium', link, language, points || 0, completed_at || null, now, now);
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

app.put('/api/challenges/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, status, priority, link, language, points, completed_at } = req.body;
    
    const current = db.prepare('SELECT * FROM challenges WHERE id = ?').get() as any;
    if (!current) return res.status(404).json({ error: 'Challenge not found' });

    const stmt = db.prepare('UPDATE challenges SET title = ?, description = ?, difficulty = ?, status = ?, priority = ?, link = ?, language = ?, points = ?, completed_at = ?, updated_at = ? WHERE id = ?');
    stmt.run(
      title !== undefined ? title : current.title,
      description !== undefined ? description : current.description,
      difficulty !== undefined ? difficulty : current.difficulty,
      status !== undefined ? status : current.status,
      priority !== undefined ? priority : current.priority,
      link !== undefined ? link : current.link,
      language !== undefined ? language : current.language,
      points !== undefined ? points : current.points,
      completed_at !== undefined ? completed_at : current.completed_at,
      Date.now(),
      id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

app.delete('/api/challenges/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('DELETE FROM challenges WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE challenges SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

app.post('/api/challenges/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE challenges SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore challenge' });
  }
});

app.use(express.json());

// --- API Routes ---

// Get all snippets (with optional filtering)
app.get('/api/snippets', (req, res) => {
  try {
    const { search, language, tag, favorite, learning_status, collection_id, project_id, library, includeTrash } = req.query;
    
    let query = `
      SELECT s.*, 
        GROUP_CONCAT(DISTINCT t.name) as tags,
        GROUP_CONCAT(DISTINCT l.name) as libraries
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN snippet_libraries sl ON s.id = sl.snippet_id
      LEFT JOIN libraries l ON sl.library_id = l.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (includeTrash !== 'true') {
      conditions.push('s.deleted_at IS NULL');
    } else {
      conditions.push('s.deleted_at IS NOT NULL');
    }

    if (collection_id) {
      query += ` INNER JOIN snippet_collections sc ON s.id = sc.snippet_id AND sc.collection_id = ?`;
      params.push(collection_id);
    }

    if (project_id) {
      conditions.push('s.project_id = ?');
      params.push(project_id);
    }

    if (favorite === 'true') {
      conditions.push('s.is_favorite = 1');
    }

    if (language) {
      conditions.push('s.language = ?');
      params.push(language);
    }

    if (library) {
      conditions.push('s.id IN (SELECT snippet_id FROM snippet_libraries sl JOIN libraries l ON sl.library_id = l.id WHERE l.name = ?)');
      params.push(library);
    }

    if (learning_status) {
      conditions.push('s.learning_status = ?');
      params.push(learning_status);
    }

    if (search) {
      conditions.push('(s.title LIKE ? OR s.description LIKE ? OR s.code LIKE ? OR s.id IN (SELECT snippet_id FROM snippet_tags st JOIN tags t ON st.tag_id = t.id WHERE t.name LIKE ?) OR s.id IN (SELECT snippet_id FROM snippet_libraries sl JOIN libraries l ON sl.library_id = l.id WHERE l.name LIKE ?))');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id ORDER BY s.updated_at DESC';

    const stmt = db.prepare(query);
    const snippets = stmt.all(...params);
    
    // Post-process tags and libraries
    const processedSnippets = snippets.map((s: any) => {
      const parts = db.prepare('SELECT * FROM snippet_parts WHERE snippet_id = ? ORDER BY sort_order ASC').all(s.id);
      return {
        ...s,
        is_favorite: Boolean(s.is_favorite),
        tags: s.tags ? s.tags.split(',') : [],
        libraries: s.libraries ? s.libraries.split(',') : [],
        parts
      };
    });

    if (tag) {
      const filtered = processedSnippets.filter((s: any) => s.tags.includes(tag));
      return res.json(filtered);
    }

    res.json(processedSnippets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// Create snippet
app.post('/api/snippets', (req, res) => {
  try {
    const { 
      title, code, language, description, tags, libraries,
      complexity, learning_status, source_url, 
      performance_notes, version_info, expert_tips,
      best_practices, common_pitfalls,
      collection_id, project_id, prerequisites, usage_example,
      test_cases, learning_time, parts, rating, refactoring_suggestions
    } = req.body;

    if (!title || !code || !language) {
      return res.status(400).json({ error: 'Title, code, and language are required' });
    }

    const id = uuidv4();
    const now = Date.now();

    const insertSnippet = db.prepare(`
      INSERT INTO snippets (
        id, title, code, language, description, 
        complexity, learning_status, source_url, 
        performance_notes, version_info, expert_tips,
        best_practices, common_pitfalls,
        prerequisites, usage_example, test_cases, learning_time,
        project_id, rating, refactoring_suggestions, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPart = db.prepare(`
      INSERT INTO snippet_parts (id, snippet_id, title, code, language, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertTag = db.prepare(`
      INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)
    `);
    
    const getTagId = db.prepare(`SELECT id FROM tags WHERE name = ?`);

    const linkTag = db.prepare(`
      INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)
    `);

    const insertLibrary = db.prepare(`
      INSERT OR IGNORE INTO libraries (id, name) VALUES (?, ?)
    `);
    
    const getLibraryId = db.prepare(`SELECT id FROM libraries WHERE name = ?`);

    const linkLibrary = db.prepare(`
      INSERT INTO snippet_libraries (snippet_id, library_id) VALUES (?, ?)
    `);

    const transaction = db.transaction(() => {
      insertSnippet.run(
        id, title, code, language, description, 
        complexity || 'Intermediate', learning_status || 'Learning', 
        source_url, performance_notes, version_info, expert_tips,
        best_practices, common_pitfalls,
        prerequisites, usage_example, test_cases, learning_time,
        project_id, rating, refactoring_suggestions, now, now
      );

      if (parts && Array.isArray(parts)) {
        parts.forEach((part: any, index: number) => {
          insertPart.run(uuidv4(), id, part.title, part.code, part.language, index);
        });
      }

      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          const cleanTagName = tagName.trim();
          if (!cleanTagName) continue;
          
          let tagId;
          const existingTag = getTagId.get(cleanTagName) as any;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            tagId = uuidv4();
            insertTag.run(tagId, cleanTagName);
          }
          linkTag.run(id, tagId);
        }
      }

      if (libraries && Array.isArray(libraries)) {
        for (const libName of libraries) {
          const cleanLibName = libName.trim();
          if (!cleanLibName) continue;
          
          let libId;
          const existingLib = getLibraryId.get(cleanLibName) as any;
          if (existingLib) {
            libId = existingLib.id;
          } else {
            libId = uuidv4();
            insertLibrary.run(libId, cleanLibName);
          }
          linkLibrary.run(id, libId);
        }
      }

      if (collection_id) {
        db.prepare('INSERT INTO snippet_collections (snippet_id, collection_id) VALUES (?, ?)').run(id, collection_id);
      }
    });

    transaction();
    res.json({ id, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
});

// Update snippet
app.put('/api/snippets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, code, language, description, tags, libraries, is_favorite,
      complexity, learning_status, source_url, 
      performance_notes, version_info, expert_tips,
      best_practices, common_pitfalls,
      last_reviewed_at,
      collection_id, project_id, prerequisites, usage_example,
      test_cases, learning_time, parts, rating, refactoring_suggestions
    } = req.body;

    if (!title || !code || !language) {
      return res.status(400).json({ error: 'Title, code, and language are required' });
    }

    const now = Date.now();

    const updateSnippet = db.prepare(`
      UPDATE snippets 
      SET title = ?, code = ?, language = ?, description = ?, is_favorite = ?, 
          complexity = ?, learning_status = ?, source_url = ?, 
          performance_notes = ?, version_info = ?, expert_tips = ?,
          best_practices = ?, common_pitfalls = ?,
          last_reviewed_at = ?, prerequisites = ?, usage_example = ?,
          test_cases = ?, learning_time = ?, project_id = ?, 
          rating = ?, refactoring_suggestions = ?, updated_at = ?
      WHERE id = ?
    `);

    const deleteParts = db.prepare(`DELETE FROM snippet_parts WHERE snippet_id = ?`);
    const insertPart = db.prepare(`
      INSERT INTO snippet_parts (id, snippet_id, title, code, language, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      updateSnippet.run(
        title, code, language, description, is_favorite ? 1 : 0, 
        complexity, learning_status, source_url, 
        performance_notes, version_info, expert_tips,
        best_practices, common_pitfalls,
        last_reviewed_at, prerequisites, usage_example,
        test_cases, learning_time, project_id, 
        rating, refactoring_suggestions, now, id
      );

      // Re-do parts
      deleteParts.run(id);
      if (parts && Array.isArray(parts)) {
        parts.forEach((part: any, index: number) => {
          insertPart.run(uuidv4(), id, part.title, part.code, part.language, index);
        });
      }

      // Re-do tags
      const deleteTags = db.prepare(`DELETE FROM snippet_tags WHERE snippet_id = ?`);
      const insertTag = db.prepare(`INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`);
      const getTagId = db.prepare(`SELECT id FROM tags WHERE name = ?`);
      const linkTag = db.prepare(`INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)`);

      deleteTags.run(id);
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          const cleanTagName = tagName.trim();
          if (!cleanTagName) continue;
          
          let tagId;
          const existingTag = getTagId.get(cleanTagName) as any;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            tagId = uuidv4();
            insertTag.run(tagId, cleanTagName);
          }
          linkTag.run(id, tagId);
        }
      }

      // Re-do libraries
      const deleteLibraries = db.prepare(`DELETE FROM snippet_libraries WHERE snippet_id = ?`);
      const insertLibrary = db.prepare(`INSERT OR IGNORE INTO libraries (id, name) VALUES (?, ?)`);
      const getLibraryId = db.prepare(`SELECT id FROM libraries WHERE name = ?`);
      const linkLibrary = db.prepare(`INSERT INTO snippet_libraries (snippet_id, library_id) VALUES (?, ?)`);

      deleteLibraries.run(id);
      if (libraries && Array.isArray(libraries)) {
        for (const libName of libraries) {
          const cleanLibName = libName.trim();
          if (!cleanLibName) continue;
          
          let libId;
          const existingLib = getLibraryId.get(cleanLibName) as any;
          if (existingLib) {
            libId = existingLib.id;
          } else {
            libId = uuidv4();
            insertLibrary.run(libId, cleanLibName);
          }
          linkLibrary.run(id, libId);
        }
      }

      if (collection_id !== undefined) {
        db.prepare('DELETE FROM snippet_collections WHERE snippet_id = ?').run(id);
        if (collection_id) {
          db.prepare('INSERT INTO snippet_collections (snippet_id, collection_id) VALUES (?, ?)').run(id, collection_id);
        }
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
});

// Delete snippet
app.delete('/api/snippets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('DELETE FROM snippets WHERE id = ?').run(id);
      db.prepare('DELETE FROM snippet_tags WHERE snippet_id = ?').run(id);
      db.prepare('DELETE FROM snippet_libraries WHERE snippet_id = ?').run(id);
      db.prepare('DELETE FROM snippet_collections WHERE snippet_id = ?').run(id);
      db.prepare('DELETE FROM snippet_parts WHERE snippet_id = ?').run(id);
    } else {
      db.prepare('UPDATE snippets SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

app.post('/api/snippets/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE snippets SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore snippet' });
  }
});

// Get all tags
app.get('/api/tags', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT t.*, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY snippet_count DESC, t.name ASC
    `);
    const tags = stmt.all();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get all libraries
app.get('/api/libraries', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT l.*, COUNT(sl.snippet_id) as snippet_count
      FROM libraries l
      LEFT JOIN snippet_libraries sl ON l.id = sl.library_id
      GROUP BY l.id
      ORDER BY snippet_count DESC, l.name ASC
    `);
    const libraries = stmt.all();
    res.json(libraries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch libraries' });
  }
});

// --- Collections API ---

app.get('/api/collections', (req, res) => {
  try {
    const { includeTrash } = req.query;
    let query = `
      SELECT c.*, COUNT(sc.snippet_id) as snippet_count
      FROM collections c
      LEFT JOIN snippet_collections sc ON c.id = sc.collection_id
    `;
    
    if (includeTrash === 'true') {
      query += ' WHERE c.deleted_at IS NOT NULL';
    } else {
      query += ' WHERE c.deleted_at IS NULL';
    }
    
    query += ' GROUP BY c.id ORDER BY c.name ASC';
    
    const collections = db.prepare(query).all();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

app.post('/api/collections', (req, res) => {
  try {
    const { name, description } = req.body;
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO collections (id, name, description, created_at) VALUES (?, ?, ?, ?)');
    stmt.run(id, name, description, Date.now());
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

app.delete('/api/collections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('DELETE FROM collections WHERE id = ?').run(id);
      db.prepare('DELETE FROM snippet_collections WHERE collection_id = ?').run(id);
    } else {
      db.prepare('UPDATE collections SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

app.post('/api/collections/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE collections SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore collection' });
  }
});

app.put('/api/collections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const stmt = db.prepare('UPDATE collections SET name = ?, description = ? WHERE id = ?');
    stmt.run(name, description, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// --- Projects API ---

app.get('/api/projects', (req, res) => {
  try {
    const { includeTrash } = req.query;
    let query = `
      SELECT p.*, 
        COUNT(s.id) as snippet_count,
        GROUP_CONCAT(DISTINCT l.name) as libraries
      FROM projects p
      LEFT JOIN snippets s ON p.id = s.project_id
      LEFT JOIN project_libraries pl ON p.id = pl.project_id
      LEFT JOIN libraries l ON pl.library_id = l.id
    `;
    
    if (includeTrash === 'true') {
      query += ' WHERE p.deleted_at IS NOT NULL';
    } else {
      query += ' WHERE p.deleted_at IS NULL';
    }
    
    query += ' GROUP BY p.id ORDER BY p.updated_at DESC';
    
    const projects = db.prepare(query).all();
    const processedProjects = projects.map((p: any) => ({
      ...p,
      libraries: p.libraries ? p.libraries.split(',') : []
    }));
    res.json(processedProjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, description, status, priority, deadline, libraries } = req.body;
    const id = uuidv4();
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO projects (id, name, description, status, priority, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    
    const insertLibrary = db.prepare(`INSERT OR IGNORE INTO libraries (id, name) VALUES (?, ?)`);
    const getLibraryId = db.prepare(`SELECT id FROM libraries WHERE name = ?`);
    const linkLibrary = db.prepare(`INSERT INTO project_libraries (project_id, library_id) VALUES (?, ?)`);

    const transaction = db.transaction(() => {
      stmt.run(id, name, description, status || 'active', priority || 'Medium', deadline || null, now, now);

      if (libraries && Array.isArray(libraries)) {
        for (const libName of libraries) {
          const cleanLibName = libName.trim();
          if (!cleanLibName) continue;
          
          let libId;
          const existingLib = getLibraryId.get(cleanLibName) as any;
          if (existingLib) {
            libId = existingLib.id;
          } else {
            libId = uuidv4();
            insertLibrary.run(libId, cleanLibName);
          }
          linkLibrary.run(id, libId);
        }
      }
    });

    transaction();
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, deadline, libraries } = req.body;
    
    const current = db.prepare('SELECT * FROM projects WHERE id = ?').get() as any;
    if (!current) return res.status(404).json({ error: 'Project not found' });

    const newName = name !== undefined ? name : current.name;
    const newDesc = description !== undefined ? description : current.description;
    const newStatus = status !== undefined ? status : current.status;
    const newPriority = priority !== undefined ? priority : current.priority;
    const newDeadline = deadline !== undefined ? deadline : current.deadline;

    const stmt = db.prepare('UPDATE projects SET name = ?, description = ?, status = ?, priority = ?, deadline = ?, updated_at = ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      stmt.run(newName, newDesc, newStatus, newPriority, newDeadline, Date.now(), id);

      // Re-do libraries
      const deleteLibraries = db.prepare(`DELETE FROM project_libraries WHERE project_id = ?`);
      const insertLibrary = db.prepare(`INSERT OR IGNORE INTO libraries (id, name) VALUES (?, ?)`);
      const getLibraryId = db.prepare(`SELECT id FROM libraries WHERE name = ?`);
      const linkLibrary = db.prepare(`INSERT INTO project_libraries (project_id, library_id) VALUES (?, ?)`);

      deleteLibraries.run(id);
      if (libraries && Array.isArray(libraries)) {
        for (const libName of libraries) {
          const cleanLibName = libName.trim();
          if (!cleanLibName) continue;
          
          let libId;
          const existingLib = getLibraryId.get(cleanLibName) as any;
          if (existingLib) {
            libId = existingLib.id;
          } else {
            libId = uuidv4();
            insertLibrary.run(libId, cleanLibName);
          }
          linkLibrary.run(id, libId);
        }
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.put('/api/projects/:id/content', (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const stmt = db.prepare('UPDATE projects SET content = ?, updated_at = ? WHERE id = ?');
    stmt.run(content, Date.now(), id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project content' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('UPDATE snippets SET project_id = NULL WHERE project_id = ?').run(id);
      db.prepare('DELETE FROM project_libraries WHERE project_id = ?').run(id);
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE projects SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.post('/api/projects/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE projects SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore project' });
  }
});

// --- Files API ---

app.get('/api/files', (req, res) => {
  try {
    const { includeTrash } = req.query;
    const query = includeTrash === 'true' 
      ? `SELECT f.*, GROUP_CONCAT(DISTINCT l.name) as libraries 
         FROM files f 
         LEFT JOIN file_libraries fl ON f.id = fl.file_id
         LEFT JOIN libraries l ON fl.library_id = l.id
         WHERE f.deleted_at IS NOT NULL 
         GROUP BY f.id
         ORDER BY f.updated_at DESC` 
      : `SELECT f.*, GROUP_CONCAT(DISTINCT l.name) as libraries 
         FROM files f 
         LEFT JOIN file_libraries fl ON f.id = fl.file_id
         LEFT JOIN libraries l ON fl.library_id = l.id
         WHERE f.deleted_at IS NULL 
         GROUP BY f.id
         ORDER BY f.updated_at DESC`;
    const files = db.prepare(query).all();
    const processedFiles = files.map((f: any) => ({
      ...f,
      libraries: f.libraries ? f.libraries.split(',') : []
    }));
    res.json(processedFiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', (req, res) => {
  try {
    const { name, content, language, folder_id, libraries } = req.body;
    const id = uuidv4();
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO files (id, name, content, language, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    const insertLibrary = db.prepare(`INSERT OR IGNORE INTO libraries (id, name) VALUES (?, ?)`);
    const getLibraryId = db.prepare(`SELECT id FROM libraries WHERE name = ?`);
    const linkLibrary = db.prepare(`INSERT INTO file_libraries (file_id, library_id) VALUES (?, ?)`);

    const transaction = db.transaction(() => {
      stmt.run(id, name, content, language, folder_id || null, now, now);

      if (libraries && Array.isArray(libraries)) {
        for (const libName of libraries) {
          const cleanLibName = libName.trim();
          if (!cleanLibName) continue;
          
          let libId;
          const existingLib = getLibraryId.get(cleanLibName) as any;
          if (existingLib) {
            libId = existingLib.id;
          } else {
            libId = uuidv4();
            insertLibrary.run(libId, cleanLibName);
          }
          linkLibrary.run(id, libId);
        }
      }
    });

    transaction();
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create file' });
  }
});

app.put('/api/files/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const current = db.prepare('SELECT * FROM files WHERE id = ?').get() as any;
    if (!current) return res.status(404).json({ error: 'File not found' });

    const name = updates.name !== undefined ? updates.name : current.name;
    const content = updates.content !== undefined ? updates.content : current.content;
    const language = updates.language !== undefined ? updates.language : current.language;
    const folder_id = updates.folder_id !== undefined ? updates.folder_id : current.folder_id;

    const stmt = db.prepare('UPDATE files SET name = ?, content = ?, language = ?, folder_id = ?, updated_at = ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      stmt.run(name, content, language, folder_id || null, Date.now(), id);

      if (updates.libraries && Array.isArray(updates.libraries)) {
        const deleteLibraries = db.prepare(`DELETE FROM file_libraries WHERE file_id = ?`);
        const insertLibrary = db.prepare(`INSERT OR IGNORE INTO libraries (id, name) VALUES (?, ?)`);
        const getLibraryId = db.prepare(`SELECT id FROM libraries WHERE name = ?`);
        const linkLibrary = db.prepare(`INSERT INTO file_libraries (file_id, library_id) VALUES (?, ?)`);

        deleteLibraries.run(id);
        for (const libName of updates.libraries) {
          const cleanLibName = libName.trim();
          if (!cleanLibName) continue;
          
          let libId;
          const existingLib = getLibraryId.get(cleanLibName) as any;
          if (existingLib) {
            libId = existingLib.id;
          } else {
            libId = uuidv4();
            insertLibrary.run(libId, cleanLibName);
          }
          linkLibrary.run(id, libId);
        }
      }
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update file' });
  }
});

app.delete('/api/files/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('DELETE FROM file_libraries WHERE file_id = ?').run(id);
      db.prepare('DELETE FROM files WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE files SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.post('/api/files/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE files SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore file' });
  }
});

// --- Workspace Folders API ---

app.get('/api/workspace_folders', (req, res) => {
  try {
    const { includeTrash } = req.query;
    const query = includeTrash === 'true' 
      ? 'SELECT * FROM workspace_folders WHERE deleted_at IS NOT NULL ORDER BY name ASC' 
      : 'SELECT * FROM workspace_folders WHERE deleted_at IS NULL ORDER BY name ASC';
    const folders = db.prepare(query).all();
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace folders' });
  }
});

app.post('/api/workspace_folders', (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const id = uuidv4();
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO workspace_folders (id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, parent_id || null, now, now);
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace folder' });
  }
});

app.put('/api/workspace_folders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const current = db.prepare('SELECT * FROM workspace_folders WHERE id = ?').get() as any;
    if (!current) return res.status(404).json({ error: 'Folder not found' });

    const name = updates.name !== undefined ? updates.name : current.name;
    const parent_id = updates.parent_id !== undefined ? updates.parent_id : current.parent_id;

    const stmt = db.prepare('UPDATE workspace_folders SET name = ?, parent_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(name, parent_id || null, Date.now(), id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace folder' });
  }
});

app.delete('/api/workspace_folders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('DELETE FROM workspace_folders WHERE id = ?').run(id);
      db.prepare('UPDATE files SET folder_id = NULL WHERE folder_id = ?').run(id);
    } else {
      db.prepare('UPDATE workspace_folders SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace folder' });
  }
});

app.post('/api/workspace_folders/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE workspace_folders SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore workspace folder' });
  }
});

// --- Definitions API ---

app.get('/api/definitions', (req, res) => {
  try {
    const { includeTrash } = req.query;
    const query = includeTrash === 'true' 
      ? 'SELECT * FROM definitions WHERE deleted_at IS NOT NULL ORDER BY term ASC' 
      : 'SELECT * FROM definitions WHERE deleted_at IS NULL ORDER BY term ASC';
    const definitions = db.prepare(query).all();
    const parsedDefinitions = definitions.map((d: any) => ({
      ...d,
      tags: d.tags ? JSON.parse(d.tags) : [],
      related_terms: d.related_terms ? JSON.parse(d.related_terms) : [],
      references: d.references ? JSON.parse(d.references) : [],
      libraries: d.libraries ? JSON.parse(d.libraries) : []
    }));
    res.json(parsedDefinitions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch definitions' });
  }
});

app.post('/api/definitions', (req, res) => {
  try {
    const { term, definition, category, language, example, related_terms, references, tags, libraries } = req.body;
    const id = uuidv4();
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO definitions (id, term, definition, category, language, example, related_terms, "references", tags, libraries, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, term, definition, category || 'General', language, example, JSON.stringify(related_terms || []), JSON.stringify(references || []), JSON.stringify(tags || []), JSON.stringify(libraries || []), now, now);
    res.json({ id, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create definition' });
  }
});

app.put('/api/definitions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { term, definition, category, language, example, related_terms, references, tags, libraries } = req.body;
    const stmt = db.prepare('UPDATE definitions SET term = ?, definition = ?, category = ?, language = ?, example = ?, related_terms = ?, "references" = ?, tags = ?, libraries = ?, updated_at = ? WHERE id = ?');
    stmt.run(term, definition, category, language, example, JSON.stringify(related_terms || []), JSON.stringify(references || []), JSON.stringify(tags || []), JSON.stringify(libraries || []), Date.now(), id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update definition' });
  }
});

app.delete('/api/definitions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (permanent === 'true') {
      db.prepare('DELETE FROM definitions WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE definitions SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete definition' });
  }
});

app.post('/api/definitions/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE definitions SET deleted_at = NULL WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore definition' });
  }
});

// --- Stats API ---

app.get('/api/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ snippets: [], files: [], definitions: [] });
    
    const searchParam = `%${q}%`;
    
    const snippets = db.prepare(`
      SELECT id, title as name, 'snippet' as type, language 
      FROM snippets 
      WHERE (title LIKE ? OR description LIKE ? OR code LIKE ?) AND deleted_at IS NULL
      LIMIT 10
    `).all(searchParam, searchParam, searchParam);
    
    const files = db.prepare(`
      SELECT id, name, 'file' as type, language 
      FROM files 
      WHERE (name LIKE ? OR content LIKE ?) AND deleted_at IS NULL
      LIMIT 10
    `).all(searchParam, searchParam);
    
    const definitions = db.prepare(`
      SELECT id, term as name, 'definition' as type, category as language 
      FROM definitions 
      WHERE (term LIKE ? OR definition LIKE ?) AND deleted_at IS NULL
      LIMIT 10
    `).all(searchParam, searchParam);
    
    res.json({ snippets, files, definitions });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const totalSnippets = db.prepare('SELECT COUNT(*) as count FROM snippets WHERE deleted_at IS NULL').get() as any;
    const langStats = db.prepare('SELECT language, COUNT(*) as count FROM snippets WHERE deleted_at IS NULL GROUP BY language').all();
    const statusStats = db.prepare('SELECT learning_status, COUNT(*) as count FROM snippets WHERE deleted_at IS NULL GROUP BY learning_status').all();
    const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM snippets WHERE is_favorite = 1 AND deleted_at IS NULL').get() as any;
    
    // New stats
    const complexityStats = db.prepare('SELECT complexity, COUNT(*) as count FROM snippets WHERE deleted_at IS NULL GROUP BY complexity').all();
    
    // Activity (last 30 days)
    const activityStats = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM snippets 
      WHERE deleted_at IS NULL AND created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all();

    // Recent snippets
    const recentSnippets = db.prepare('SELECT id, title, language, created_at FROM snippets WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5').all();

    // Library stats
    const libraryStats = db.prepare(`
      SELECT l.name, COUNT(sl.snippet_id) as count
      FROM libraries l
      JOIN snippet_libraries sl ON l.id = sl.library_id
      JOIN snippets s ON sl.snippet_id = s.id
      WHERE s.deleted_at IS NULL
      GROUP BY l.name
      ORDER BY count DESC
    `).all();

    res.json({
      total: totalSnippets.count,
      languages: langStats,
      statuses: statusStats,
      favorites: favoriteCount.count,
      complexity: complexityStats,
      activity: activityStats,
      recent: recentSnippets,
      libraries: libraryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/stats/libraries', (req, res) => {
  try {
    const { language } = req.query;
    let query = `
      SELECT l.name, COUNT(sl.snippet_id) as count
      FROM libraries l
      JOIN snippet_libraries sl ON l.id = sl.library_id
      JOIN snippets s ON sl.snippet_id = s.id
      WHERE s.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (language) {
      query += ' AND s.language = ?';
      params.push(language);
    }
    query += ' GROUP BY l.name ORDER BY count DESC';
    const stats = db.prepare(query).all(...params);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch library stats' });
  }
});


// --- Vite Middleware ---

async function startServer() {
  app.get('/api/backup', (req, res) => {
  try {
    const snippets = db.prepare('SELECT * FROM snippets').all();
    const collections = db.prepare('SELECT * FROM collections').all();
    const snippet_collections = db.prepare('SELECT * FROM snippet_collections').all();
    const tags = db.prepare('SELECT * FROM tags').all();
    const snippet_tags = db.prepare('SELECT * FROM snippet_tags').all();
    const projects = db.prepare('SELECT * FROM projects').all();
    const snippet_parts = db.prepare('SELECT * FROM snippet_parts').all();
    const files = db.prepare('SELECT * FROM files').all();
    const definitions = db.prepare('SELECT * FROM definitions').all();
    const workspace_folders = db.prepare('SELECT * FROM workspace_folders').all();
    const libraries = db.prepare('SELECT * FROM libraries').all();
    const snippet_libraries = db.prepare('SELECT * FROM snippet_libraries').all();
    const project_libraries = db.prepare('SELECT * FROM project_libraries').all();
    const file_libraries = db.prepare('SELECT * FROM file_libraries').all();
    const challenges = db.prepare('SELECT * FROM challenges').all();
    
    res.json({ 
      snippets, 
      collections, 
      snippet_collections, 
      tags, 
      snippet_tags, 
      projects, 
      snippet_parts, 
      files, 
      definitions,
      workspace_folders,
      libraries,
      snippet_libraries,
      project_libraries,
      file_libraries,
      challenges
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const { snippets, collections, snippet_collections, tags, snippet_tags, projects, snippet_parts, files, definitions, workspace_folders, libraries, snippet_libraries, project_libraries, file_libraries, challenges } = req.body;
    
    db.transaction(() => {
      // Clear existing data
      db.prepare('DELETE FROM snippet_parts').run();
      db.prepare('DELETE FROM snippet_tags').run();
      db.prepare('DELETE FROM snippet_collections').run();
      db.prepare('DELETE FROM related_snippets').run();
      db.prepare('DELETE FROM tags').run();
      db.prepare('DELETE FROM snippets').run();
      db.prepare('DELETE FROM collections').run();
      db.prepare('DELETE FROM projects').run();
      db.prepare('DELETE FROM files').run();
      db.prepare('DELETE FROM definitions').run();
      db.prepare('DELETE FROM workspace_folders').run();
      db.prepare('DELETE FROM libraries').run();
      db.prepare('DELETE FROM snippet_libraries').run();
      db.prepare('DELETE FROM project_libraries').run();
      db.prepare('DELETE FROM file_libraries').run();
      db.prepare('DELETE FROM challenges').run();

      // Restore data
      if (collections) {
        const insert = db.prepare('INSERT INTO collections (id, name, description, created_at, deleted_at) VALUES (?, ?, ?, ?, ?)');
        collections.forEach((c: any) => insert.run(c.id, c.name, c.description, c.created_at, c.deleted_at || null));
      }

      if (projects) {
        const insert = db.prepare('INSERT INTO projects (id, name, description, status, created_at, updated_at, content, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        projects.forEach((p: any) => insert.run(p.id, p.name, p.description, p.status || 'active', p.created_at, p.updated_at, p.content, p.deleted_at || null));
      }

      if (workspace_folders) {
        const insert = db.prepare('INSERT INTO workspace_folders (id, name, parent_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)');
        workspace_folders.forEach((f: any) => insert.run(f.id, f.name, f.parent_id, f.created_at, f.updated_at, f.deleted_at || null));
      }

      if (files) {
        const insert = db.prepare('INSERT INTO files (id, name, content, language, folder_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        files.forEach((f: any) => insert.run(f.id, f.name, f.content, f.language, f.folder_id, f.created_at, f.updated_at, f.deleted_at || null));
      }

      if (snippets) {
        const insert = db.prepare(`
          INSERT INTO snippets (
            id, title, code, language, description, is_favorite, 
            complexity, learning_status, source_url, performance_notes, 
            version_info, expert_tips, best_practices, common_pitfalls,
            created_at, updated_at, 
            last_reviewed_at, project_id, prerequisites, usage_example, 
            test_cases, learning_time, rating, refactoring_suggestions, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        snippets.forEach((s: any) => insert.run(
          s.id, s.title, s.code, s.language, s.description, s.is_favorite,
          s.complexity, s.learning_status, s.source_url, s.performance_notes,
          s.version_info, s.expert_tips, s.best_practices, s.common_pitfalls,
          s.created_at, s.updated_at,
          s.last_reviewed_at, s.project_id, s.prerequisites, s.usage_example,
          s.test_cases, s.learning_time, s.rating, s.refactoring_suggestions, s.deleted_at || null
        ));
      }

      if (tags) {
        const insert = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
        tags.forEach((t: any) => insert.run(t.id, t.name));
      }

      if (snippet_tags) {
        const insert = db.prepare('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)');
        snippet_tags.forEach((st: any) => insert.run(st.snippet_id, st.tag_id));
      }

      if (snippet_collections) {
        const insert = db.prepare('INSERT INTO snippet_collections (snippet_id, collection_id) VALUES (?, ?)');
        snippet_collections.forEach((sc: any) => insert.run(sc.snippet_id, sc.collection_id));
      }

      if (snippet_parts) {
        const insert = db.prepare('INSERT INTO snippet_parts (id, snippet_id, title, code, language, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
        snippet_parts.forEach((p: any) => insert.run(p.id, p.snippet_id, p.title, p.code, p.language, p.sort_order));
      }

      if (definitions) {
        const insert = db.prepare('INSERT INTO definitions (id, term, definition, category, complexity, learning_status, language, example, related_terms, "references", tags, libraries, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        definitions.forEach((d: any) => insert.run(
          d.id, d.term, d.definition, d.category || 'General', 
          d.complexity || 'Beginner', d.learning_status || 'Learning',
          d.language, d.example, d.related_terms || '[]', d.references || '[]', 
          d.tags || '[]', d.libraries || '[]', d.created_at, d.updated_at, d.deleted_at || null
        ));
      }

      if (libraries) {
        const insert = db.prepare('INSERT INTO libraries (id, name) VALUES (?, ?)');
        libraries.forEach((l: any) => insert.run(l.id, l.name));
      }

      if (snippet_libraries) {
        const insert = db.prepare('INSERT INTO snippet_libraries (snippet_id, library_id) VALUES (?, ?)');
        snippet_libraries.forEach((sl: any) => insert.run(sl.snippet_id, sl.library_id));
      }

      if (project_libraries) {
        const insert = db.prepare('INSERT INTO project_libraries (project_id, library_id) VALUES (?, ?)');
        project_libraries.forEach((pl: any) => insert.run(pl.project_id, pl.library_id));
      }

      if (file_libraries) {
        const insert = db.prepare('INSERT INTO file_libraries (file_id, library_id) VALUES (?, ?)');
        file_libraries.forEach((fl: any) => insert.run(fl.file_id, fl.library_id));
      }

      if (challenges) {
        const insert = db.prepare('INSERT INTO challenges (id, title, description, difficulty, status, priority, link, language, points, completed_at, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        challenges.forEach((c: any) => insert.run(
          c.id, c.title, c.description, c.difficulty || 'Intermediate', c.status || 'Todo',
          c.priority || 'Medium', c.link, c.language, c.points || 0, c.completed_at || null,
          c.created_at, c.updated_at, c.deleted_at || null
        ));
      }
    })();

    res.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Restore failed' });
  }
});

app.delete('/api/reset', (req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM snippet_parts').run();
      db.prepare('DELETE FROM snippet_tags').run();
      db.prepare('DELETE FROM snippet_collections').run();
      db.prepare('DELETE FROM related_snippets').run();
      db.prepare('DELETE FROM tags').run();
      db.prepare('DELETE FROM snippets').run();
      db.prepare('DELETE FROM collections').run();
      db.prepare('DELETE FROM projects').run();
      db.prepare('DELETE FROM files').run();
      db.prepare('DELETE FROM definitions').run();
      db.prepare('DELETE FROM workspace_folders').run();
      db.prepare('DELETE FROM libraries').run();
      db.prepare('DELETE FROM snippet_libraries').run();
      db.prepare('DELETE FROM project_libraries').run();
      db.prepare('DELETE FROM file_libraries').run();
      db.prepare('DELETE FROM challenges').run();
    })();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Security endpoints
app.get('/api/security/lock', (req, res) => {
  try {
    const lock = db.prepare('SELECT value FROM security WHERE key = ?').get('app_lock') as any;
    res.json({ enabled: !!lock, password: lock ? lock.value : null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lock status' });
  }
});

app.post('/api/security/lock', (req, res) => {
  try {
    const { password } = req.body;
    if (password) {
      db.prepare('INSERT OR REPLACE INTO security (key, value) VALUES (?, ?)').run('app_lock', password);
    } else {
      db.prepare('DELETE FROM security WHERE key = ?').run('app_lock');
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lock' });
  }
});

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    // (Assuming build is run before start)
    const path = await import('path');
    const staticPath = path.resolve(__dirname, 'dist');
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
