# Editorial Pipeline

This directory contains the server-side AI-driven editorial pipeline for generating and refining prompt content.

## Overview

The pipeline supports two content modes:

- **Mode A (Manual/Template)**: Questions defined with simple text, prompts generated at runtime via templates
- **Mode B (Editorial/Pipeline)**: Questions with AI-generated, curated prompt variants stored in content

## Architecture

### Current Implementation (Stub)

```
pipeline/
├── validate-content.ts      # Validates content against Zod schema
├── generate-stub.ts          # Demonstrates generation with stub provider
└── providers/
    ├── types.ts              # Provider interface definitions
    └── stub-provider.ts      # Deterministic stub for testing
```

### Future Implementation (Production)

```
pipeline/
├── validate-content.ts
├── generate-variants.ts      # Real generation using LLM APIs
├── refresh-content.ts        # Scheduled job to regenerate prompts
├── approve-variants.ts       # Editorial approval workflow
└── providers/
    ├── types.ts
    ├── claude-provider.ts    # Anthropic API integration
    ├── openai-provider.ts    # OpenAI API integration
    ├── gemini-provider.ts    # Google API integration
    └── perplexity-provider.ts # Perplexity API integration
```

## Provider Interface

All providers implement the `LLMProvider` interface:

```typescript
interface LLMProvider {
  name: string;
  generateVariant(request: GenerateVariantRequest): Promise<GenerateVariantResponse>;
}
```

### Real Provider Implementation

Future providers will:

1. **Initialize with API keys from environment variables**
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-proj-...
   GOOGLE_API_KEY=...
   PERPLEXITY_API_KEY=...
   ```

2. **Call actual LLM APIs** to generate refined prompts
   - Use meta-prompting to generate high-quality variants
   - Optimize for each LLM's specific strengths
   - Include speech-friendly versions when requested

3. **Handle production concerns**
   - Rate limiting and backoff
   - Error handling and retries
   - Cost tracking and budgets
   - Caching to avoid redundant calls

4. **Store generated content**
   - Write variants back to content files
   - Version control for editorial review
   - A/B test different prompt variations

## Scripts

### Validate Content

Validates all questions against Zod schema:

```bash
bun run pipeline:validate
```

### Generate Stub Content

Demonstrates generation pipeline with stub provider:

```bash
bun run pipeline:generate
```

Output shows deterministic stub prompts for today's question across all LLMs.

## Content Storage

Generated variants can be stored in two ways:

### Option 1: In-place (questions.ts)

```typescript
{
  id: "career-001",
  category: "career",
  simple_text: "What can I specifically do to make the next step in my career?",
  variants: {
    claude: {
      title: "Career Growth Introspection",
      fullPrompt: "<context>...</context>...",
    },
    chatgpt: {
      title: "Career Growth Introspection",
      fullPrompt: "You're analyzing...",
    },
    // ... other LLMs
  },
}
```

### Option 2: Separate files

```
content/
├── questions.ts           # Base questions
└── variants/
    ├── career-001.ts      # All variants for career-001
    └── ideas-001.ts       # All variants for ideas-001
```

## Deployment

The pipeline runs **server-side only**:

- Use Vercel serverless functions or cron jobs
- Store API keys in environment variables
- Never expose keys to client
- Can run on schedule to refresh content
- Results are static files deployed with the app

## User-Facing Product

**Important**: Users never call LLM APIs directly. They only:

1. View questions (static content)
2. Select LLM preference
3. Copy optimized prompts
4. Paste into their LLM of choice

All generation happens server-side in the pipeline, results are deployed as static content.

## Example Real Provider (Claude)

```typescript
import Anthropic from "@anthropic-ai/sdk";

export class ClaudeProvider implements LLMProvider {
  name = "claude";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateVariant(request: GenerateVariantRequest): Promise<GenerateVariantResponse> {
    const metaPrompt = `Generate an optimized prompt for Claude that helps users introspect on their AI conversations.

Question: "${request.questionText}"
Speech-friendly: ${request.speechFriendly}

Create a prompt that:
1. Uses Claude's preferred XML structure
2. Handles both cases: conversation history available or not
3. Requests specific, actionable insights
4. ${request.speechFriendly ? "Includes instructions for speech-friendly output" : ""}

Output the full prompt text.`;

    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: metaPrompt }],
    });

    const fullPrompt = message.content[0].type === "text" ? message.content[0].text : "";

    return {
      title: request.questionText,
      fullPrompt,
    };
  }
}
```

## Next Steps

To implement the real pipeline:

1. Install provider SDKs:
   ```bash
   bun add @anthropic-ai/sdk openai @google/generative-ai
   ```

2. Create real provider implementations

3. Add environment variables to Vercel

4. Create generation script that writes to content files

5. Set up Vercel cron jobs for scheduled refresh

6. Add editorial approval workflow

7. Implement A/B testing for prompt variants
