# Introspection MVP

A clean, minimal web app for reflecting on AI conversations. Copy optimized prompts, paste into your favorite LLM, gain insights.

## 🎯 What It Does

Introspection provides curated questions designed to help you extract value from your AI chat history:

- **"What's the craziest thing I've thought of so far?"**
- **"What new topic would be best for me to explore next?"**
- **"What can I specifically do to make the next step in my career?"**

Select your LLM (Claude, ChatGPT, Gemini, Perplexity), optionally enable speech-friendly output for TTS, and copy an optimized prompt tailored for that specific LLM.

## ✨ Key Features

### User-Facing (MVP)
- ✅ **18 curated introspection questions** across 6 categories
- ✅ **LLM-specific prompt optimization** (Claude, ChatGPT, Gemini, Perplexity)
- ✅ **Visual LLM selector** (cards, not dropdown)
- ✅ **Copy-to-clipboard** with success animation
- ✅ **Speech-friendly toggle** for TTS optimization
- ✅ **Deterministic daily rotation** (hash-based)
- ✅ **Question library** with category filtering
- ✅ **Dev-only preview route** (/__preview in development)
- ✅ **Premium minimal design** (60-70% whitespace, one accent color)
- ✅ **Dark mode ready** (next-themes wired, toggle hidden in MVP)

### Architecture (Future-Ready)
- ✅ **Clean separation**: Templates (Mode A) vs. Editorial Variants (Mode B)
- ✅ **Pipeline infrastructure** for future AI-driven content generation
- ✅ **Zod validation** for content schema
- ✅ **Provider interface** for pluggable LLM APIs
- ✅ **Stub provider** for testing pipeline
- ✅ **Ready for Vercel deployment**

## 🏗️ Architecture

### Two Content Modes

**Mode A (Manual/Template)** - *Currently Active*
- Questions defined with simple text
- Prompts generated at runtime via LLM-specific templates
- Templates in `/lib/prompt/templates/{claude,chatgpt,gemini,perplexity}.ts`

**Mode B (Editorial/Pipeline)** - *Infrastructure Ready*
- AI-generated, curated prompt variants stored in content
- Server-side generation using real LLM APIs
- Pipeline in `/pipeline` directory (stub implementation complete)

### Request Flow

```
User selects question
    ↓
Check if question.variants[llm] exists
    ↓
YES: Use editorial variant (Mode B)
NO:  Generate from template (Mode A)
    ↓
Apply speech-friendly transformations if enabled
    ↓
Return { title, fullPrompt }
    ↓
User clicks "Copy Prompt to Clipboard"
    ↓
Success animation (checkmark + "Copied!" for 1.5s)
```

### File Structure

```
app/
├── layout.tsx              # Root layout with theme provider
├── page.tsx                # Today's question view
├── library/page.tsx        # Browsable question catalog
└── __preview/page.tsx      # Dev-only: all prompts for today

components/
├── ui/                     # shadcn primitives
├── llm-selector.tsx        # Visual LLM cards
├── copy-button.tsx         # Copy with animation
├── question-hero.tsx       # Large bold question display
├── speech-toggle.tsx       # TTS toggle
└── prompt-preview.tsx      # Collapsible prompt preview

lib/
├── prompt/
│   ├── engine.ts           # generatePrompt() - core logic
│   ├── templates/          # LLM-specific templates
│   └── types.ts            # Shared types
├── content/
│   ├── schema.ts           # Zod schemas
│   ├── loader.ts           # Load & validate questions
│   └── rotation.ts         # Daily rotation logic
└── utils.ts                # hashString(), getTodayString()

content/
├── questions.ts            # 18 questions across 6 categories
└── today.ts                # Override (null = use rotation)

pipeline/
├── README.md               # Pipeline documentation
├── validate-content.ts     # Zod validation script
├── generate-stub.ts        # Demo generation
└── providers/
    ├── types.ts            # LLMProvider interface
    └── stub-provider.ts    # Deterministic stub
```

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)
- Node.js 18+ (for compatibility)

### Installation

```bash
# Install dependencies
bun install

# Run dev server
bun run dev
# → http://localhost:3000

# Build for production
bun run build

# Start production server
bun run start
```

### Development Commands

```bash
# Linting & Formatting
bun run lint          # Check code with Biome
bun run lint:fix      # Fix issues
bun run format        # Format code

# Pipeline Scripts
bun run pipeline:validate   # Validate content with Zod
bun run pipeline:generate   # Demo stub generation

# Testing
bun run test          # Run Playwright tests
bun run test:ui       # Interactive test UI
```

## 🧪 Testing

5 smoke tests using Playwright:

1. Homepage loads and displays question
2. LLM selection works (card highlighting)
3. Copy button shows success state and resets
4. Library page loads questions
5. Speech-friendly toggle works

```bash
# Run tests
bun run test

# Interactive mode
bun run test:ui
```

## 📝 Content Management

### Add a Question

Edit `/content/questions.ts`:

```typescript
{
  id: "unique-id",
  category: "career", // career | ideas | learning | patterns | productivity | reflection
  simpleText: "Your question here?",
  tags: ["tag1", "tag2"],
  cadence: "weekly", // daily | weekly | monthly
}
```

Run validation:
```bash
bun run pipeline:validate
```

### Override Today's Question

Edit `/content/today.ts`:

```typescript
const config: TodayConfig = {
  todayQuestionId: "career-001", // Force this question
  // OR
  todayQuestionId: null, // Use rotation
};
```

### Add Editorial Variant (Mode B)

```typescript
{
  id: "career-001",
  category: "career",
  simpleText: "What can I do to make the next step in my career?",
  variants: {
    claude: {
      title: "Career Growth Analysis",
      fullPrompt: "<context>...</context>..."
    },
    // ... other LLMs
  }
}
```

When `variants[llm]` exists, it overrides the template.

## 🎨 Design System

### Colors (Tailwind v4)

```css
--color-accent: #7c3aed   /* Deep purple - THE one accent color */
--color-background: #ffffff
--color-foreground: #1a1a1a
--color-muted: #f5f5f5
--color-muted-foreground: #6b6b6b
```

Dark mode auto-inverts via `prefers-color-scheme`.

### Typography Scale

- **Hero (question)**: 48px-72px bold (32px-48px on mobile)
- **Body large**: 18px-20px
- **Body**: 16px
- **Small/meta**: 14px
- **Tiny**: 12px

### Spacing Philosophy

- Generous vertical rhythm: 80-120px between sections
- Max content width: 900px (4xl)
- 60-70% of screen is whitespace
- Single-column layout (no sidebars)

## 🔒 Hard Constraints (Met)

- ✅ Copy/paste only - no user auth, no database, no user API keys
- ✅ No direct client LLM calls
- ✅ Vercel deployment ready
- ✅ Pipeline area for future server-side generation
- ✅ Single-column UI, max 900px, premium minimal aesthetic
- ✅ ONE accent color only (deep purple)
- ✅ LLM selection as visual cards (not dropdown)
- ✅ Copy button success animation with 1.5s reset
- ✅ Prompts handle both cases: history available vs. not available

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Primitives**: shadcn/ui (Button, Card, Switch only)
- **Animations**: Framer Motion
- **Dark Mode**: next-themes
- **Validation**: Zod
- **Testing**: Playwright
- **Linting**: Biome
- **Runtime**: Bun

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**TL;DR for Vercel:**
```bash
git push origin main
# Then import repo in Vercel Dashboard
# Auto-deploys with zero config
```

## 🔮 Future Enhancements

### Phase 2: Editorial Pipeline (Mode B)
- [ ] Implement real LLM providers (ClaudeProvider, OpenAIProvider, etc.)
- [ ] Generate refined prompt variants using meta-prompting
- [ ] Store variants in content files
- [ ] Set up scheduled regeneration (Vercel Cron)
- [ ] Add editorial approval workflow
- [ ] A/B test prompt variants

### Phase 3: Advanced Features
- [ ] Custom question creation
- [ ] Save favorite questions
- [ ] Question history tracking
- [ ] Browser extension
- [ ] Share questions via URL
- [ ] Export conversation summaries
- [ ] Analytics on question effectiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test`
5. Run linter: `bun run lint:fix`
6. Validate content: `bun run pipeline:validate`
7. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Design inspiration from Linear, Stripe, Arc Browser
- shadcn/ui for component primitives
- Tailwind CSS for styling system
- Next.js team for App Router

---

**Introspection v0.2.0** - Because your AI conversations are worth revisiting.
