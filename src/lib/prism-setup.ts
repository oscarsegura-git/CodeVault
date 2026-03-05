import Prism from 'prismjs';

// 1. Load base components first
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-clike';

// 2. Load languages that depend on markup or clike
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-haskell';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-perl';

// Ensure markup is aliased correctly if needed
if (Prism.languages.markup && !Prism.languages.html) {
  Prism.languages.html = Prism.languages.markup;
}

export const PRISM_LANG_MAP: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'python': 'python',
  'java': 'java',
  'c++': 'cpp',
  'c#': 'csharp',
  'go': 'go',
  'rust': 'rust',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'php': 'php',
  'ruby': 'ruby',
  'sql': 'sql',
  'html': 'markup',
  'css': 'css',
  'shell': 'bash',
  'bash': 'bash',
  'json': 'json',
  'markdown': 'markdown',
  'yaml': 'yaml',
  'docker': 'docker',
  'graphql': 'graphql',
  'dart': 'dart',
  'r': 'r',
  'scala': 'scala',
  'haskell': 'haskell',
  'lua': 'lua',
  'perl': 'perl'
};

export const getPrismLang = (lang: string) => {
  const normalized = lang.toLowerCase();
  return PRISM_LANG_MAP[normalized] || 'javascript';
};

export default Prism;
