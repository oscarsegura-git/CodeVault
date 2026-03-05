export interface SnippetPart {
  id: string;
  snippet_id: string;
  title?: string;
  code: string;
  language: string;
  sort_order: number;
}

export interface Library {
  id: string;
  name: string;
  snippet_count?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  content?: string;
  status?: 'planning' | 'active' | 'completed' | 'paused';
  priority?: 'Low' | 'Medium' | 'High';
  deadline?: number;
  created_at: number;
  updated_at: number;
  snippet_count?: number;
  libraries?: string[];
}

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  is_favorite: boolean;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  learning_status: 'Learning' | 'Mastered' | 'Reference';
  source_url?: string;
  performance_notes?: string;
  version_info?: string;
  expert_tips?: string;
  best_practices?: string;
  common_pitfalls?: string;
  created_at: number;
  updated_at: number;
  last_reviewed_at?: number;
  prerequisites?: string;
  usage_example?: string;
  test_cases?: string;
  learning_time?: string;
  core_concepts?: string[];
  security_implications?: string;
  scalability_notes?: string;
  trade_offs?: string;
  tags: string[];
  libraries?: string[];
  collections?: string[];
  project_id?: string;
  parts?: SnippetPart[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at: number;
  snippet_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  snippet_count?: number;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  parent_id?: string;
  created_at: number;
  updated_at: number;
}

export interface File {
  id: string;
  name: string;
  content: string;
  language: string;
  folder_id?: string;
  created_at: number;
  updated_at: number;
  libraries?: string[];
}

export interface Definition {
  id: string;
  term: string;
  definition: string;
  category: 'General' | 'Syntax' | 'Data Structure' | 'Algorithm' | 'Pattern' | 'Library' | 'Tool' | 'Variable' | 'Class' | 'Type' | 'Function';
  complexity?: 'Beginner' | 'Intermediate' | 'Advanced';
  learning_status?: 'Learning' | 'Mastered' | 'Reference';
  language?: string;
  example?: string;
  related_terms?: string[]; // stored as JSON string in DB
  references?: string[]; // stored as JSON string in DB
  tags?: string[]; // stored as JSON string in DB
  libraries?: string[]; // stored as JSON string in DB
  created_at: number;
  updated_at: number;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Todo' | 'In Progress' | 'Completed';
  priority?: 'Low' | 'Medium' | 'High';
  link?: string;
  language?: string;
  points?: number;
  category?: string;
  estimated_time?: number;
  completed_at?: number;
  tags?: string[];
  hints?: string[];
  created_at: number;
  updated_at: number;
}
