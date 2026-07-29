# Academy Platform Skill

## Overview
Build a docs-style learning platform with sidebar navigation, module overviews, lesson reader, quiz system, and progress tracking.

## Architecture

### Data Model (courses.ts)
```typescript
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown
  quiz: QuizQuestion[];
  summary?: string;
  estimatedMinutes?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  keyIdeas?: string[];
  quizPrep?: string[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  overviewContent?: string; // Markdown for module overview page
  learningGoals?: string[];
  keyIdeas?: string[];
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  students: string;
  rating: number;
  icon: string;
  color: string;
  prerequisites: string[];
  modules: Module[];
}
```

### Hash Routing
```typescript
// Alias map: homepage slugs → lesson/module IDs
const HASH_ALIASES: Record<string, string> = {
  'crypto-basics': 'what-is-blockchain',
  'bitcoin-deep-dive': 'bitcoin-basics',
  'ethereum-evm': 'ethereum-smart-contracts',
  'defi-basics': 'understanding-defi',
  'wallet-security': 'wallets-security',
  'build-web3': 'solidity-basics',
};

// Node resolver: finds module OR lesson by ID
type AcademyNode =
  | { type: 'module'; course: Course; module: Module }
  | { type: 'lesson'; course: Course; module: Module; lesson: Lesson };

function findAcademyNode(id: string): AcademyNode | null {
  for (const course of courses) {
    for (const mod of course.modules) {
      if (mod.id === id) return { type: 'module', course, module: mod };
      for (const lesson of mod.lessons) {
        if (lesson.id === id) return { type: 'lesson', course, module: mod, lesson };
      }
    }
  }
  return null;
}
```

### Hash Resolution (with hashchange listener)
```typescript
useEffect(() => {
  const resolveHash = () => {
    const hash = window.location.hash.slice(1);
    const next = hash ? HASH_ALIASES[hash] || hash : courses[0]?.modules[0]?.id ?? null;
    setActiveId(next);
  };
  resolveHash();
  window.addEventListener('hashchange', resolveHash);
  return () => window.removeEventListener('hashchange', resolveHash);
}, []);

// Use pushState (not replaceState) so back button works
const updateHash = useCallback((id: string) => {
  setActiveId(id);
  window.history.pushState(null, '', `#${id}`);
}, []);
```

### Sidebar Behavior
- Module title click → opens module overview
- Chevron click → expand/collapse lessons only
- Lesson click → opens lesson reader

### Markdown Rendering
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents = {
  p: ({ children }) => <p className="text-gray-300 leading-8 mb-5">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-[length:100%_2px] bg-no-repeat bg-left-bottom pb-0.5">
      {children}
    </strong>
  ),
  h2: ({ children }) => <h2 className="mt-12 mb-5 text-2xl md:text-3xl font-bold text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 mb-3 text-xl font-semibold text-white">{children}</h3>,
  code: ({ inline, children, className }) => {
    if (inline) return <code className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-purple-200">{children}</code>;
    return <pre className="my-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#050816] p-4 text-sm"><code className={className}>{children}</code></pre>;
  },
};
```

### Quiz Gating
- Learning materials: public (no wallet)
- Start Quiz: requires wallet connect
- Submit Quiz: requires wallet + correct answers
- PASS_THRESHOLD: 100% (all correct)
- XP awarded on pass: +100 XP per quiz
- Shuffle answers per attempt using Fisher-Yates

### Progress System
```typescript
// localStorage key per address
const key = `verse-progress:${address.toLowerCase()}`;

// XP model
const XP_READ_LESSON = 20;
const XP_PASS_QUIZ = 100;
const LEVELS = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400];

function calcLevel(totalXP: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i]) return i + 1;
  }
  return 1;
}
```

### Prev/Next Navigation
```typescript
const flatLessons = courses.flatMap(c => c.modules.flatMap(m => m.lessons));
const currentIndex = flatLessons.findIndex(l => l.id === activeId);
const hasNext = currentIndex < flatLessons.length - 1;
const hasPrev = currentIndex > 0;
```
