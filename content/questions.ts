import type { Question } from "@/lib/content/schema";

export const questions: Question[] = [
  // Career Development
  {
    id: "career-001",
    category: "career",
    simpleText: "What can I specifically do to make the next step in my career?",
    tags: ["career", "action", "growth"],
    cadence: "weekly",
  },
  {
    id: "career-002",
    category: "career",
    simpleText: "What skills have I been most curious about developing?",
    tags: ["career", "skills", "learning"],
    cadence: "weekly",
  },
  {
    id: "career-003",
    category: "career",
    simpleText: "What professional challenges have I discussed most frequently?",
    tags: ["career", "challenges", "patterns"],
    cadence: "monthly",
  },

  // Ideas & Creativity
  {
    id: "ideas-001",
    category: "ideas",
    simpleText: "What's the craziest thing I've thought of so far?",
    tags: ["creativity", "brainstorm", "innovation"],
    cadence: "daily",
  },
  {
    id: "ideas-002",
    category: "ideas",
    simpleText: "What unexpected connections have emerged between my different interests?",
    tags: ["creativity", "patterns", "synthesis"],
    cadence: "weekly",
  },
  {
    id: "ideas-003",
    category: "ideas",
    simpleText: "Which of my ideas have the most potential for real-world impact?",
    tags: ["ideas", "impact", "evaluation"],
    cadence: "monthly",
  },

  // Learning & Knowledge
  {
    id: "learning-001",
    category: "learning",
    simpleText: "What new topic would be best for me to explore next?",
    tags: ["learning", "exploration", "growth"],
    cadence: "weekly",
  },
  {
    id: "learning-002",
    category: "learning",
    simpleText: "What knowledge gaps keep appearing in my questions?",
    tags: ["learning", "gaps", "self-awareness"],
    cadence: "weekly",
  },
  {
    id: "learning-003",
    category: "learning",
    simpleText: "How has my understanding of [topic] evolved over time?",
    tags: ["learning", "evolution", "meta-cognition"],
    cadence: "monthly",
  },

  // Patterns & Self-Awareness
  {
    id: "patterns-001",
    category: "patterns",
    simpleText: "What patterns appear in the types of questions I ask?",
    tags: ["patterns", "meta", "self-awareness"],
    cadence: "monthly",
  },
  {
    id: "patterns-002",
    category: "patterns",
    simpleText: "What topics do I keep coming back to?",
    tags: ["patterns", "interests", "themes"],
    cadence: "weekly",
  },
  {
    id: "patterns-003",
    category: "patterns",
    simpleText: "How does my thinking change when I'm problem-solving vs. brainstorming?",
    tags: ["patterns", "thinking-styles", "meta-cognition"],
    cadence: "monthly",
  },

  // Productivity & Process
  {
    id: "productivity-001",
    category: "productivity",
    simpleText: "What's blocking me from making progress on my goals?",
    tags: ["productivity", "blockers", "action"],
    cadence: "weekly",
  },
  {
    id: "productivity-002",
    category: "productivity",
    simpleText: "Which of my projects or ideas should I prioritize right now?",
    tags: ["productivity", "prioritization", "focus"],
    cadence: "weekly",
  },
  {
    id: "productivity-003",
    category: "productivity",
    simpleText: "What systems or processes have I been wanting to implement?",
    tags: ["productivity", "systems", "optimization"],
    cadence: "monthly",
  },

  // Reflection & Growth
  {
    id: "reflection-001",
    category: "reflection",
    simpleText: "What assumptions have I challenged or changed recently?",
    tags: ["reflection", "growth", "mindset"],
    cadence: "monthly",
  },
  {
    id: "reflection-002",
    category: "reflection",
    simpleText: "What am I learning about myself through these conversations?",
    tags: ["reflection", "self-awareness", "meta"],
    cadence: "weekly",
  },
  {
    id: "reflection-003",
    category: "reflection",
    simpleText: "Where is there the biggest gap between my intentions and my actions?",
    tags: ["reflection", "alignment", "accountability"],
    cadence: "monthly",
  },
];
