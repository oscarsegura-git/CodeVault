import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "PHP",
  "Ruby",
  "SQL",
  "HTML",
  "CSS",
  "Shell",
  "JSON",
  "Markdown",
  "YAML",
  "Docker",
  "GraphQL",
  "Dart",
  "R",
  "Scala",
  "Haskell",
  "Lua",
  "Perl",
  "Other"
];

export const COMPLEXITY_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const LEARNING_STATUSES = ["Learning", "Mastered", "Reference"] as const;

