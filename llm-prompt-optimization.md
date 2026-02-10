# LLM Prompt Optimization Guide

Token-concise reference for crafting optimal prompts for each supported LLM.

## Anthropic (Claude)

**Strengths**: Long context, nuanced analysis, following complex instructions, ethical reasoning

**Optimization Strategies**:
- Use XML tags for structure: `<context>`, `<task>`, `<examples>`
- Explicit instructions work best ("Think step-by-step", "First analyze X, then Y")
- Prefers detailed context over brevity
- Responds well to chain-of-thought prompting
- Use "Here's what I need:" format for clarity
- Benefits from role assignment ("You are an expert analyst...")

**Prompt Template**:
```
<context>[Background about past conversations]</context>
<task>[Specific introspection question]</task>

Please analyze my conversation history and provide:
1. [First aspect]
2. [Second aspect]
3. [Actionable insights]
```

---

## ChatGPT (OpenAI)

**Strengths**: Conversational, creative, broad knowledge, balanced responses

**Optimization Strategies**:
- Direct, conversational tone works best
- Benefits from numbered lists and clear structure
- Responds well to "Analyze...", "Identify...", "Summarize..." commands
- Effective with few-shot examples
- Use markdown formatting for clarity
- Works well with persona-based prompts

**Prompt Template**:
```
You're analyzing my past AI conversations to help me gain insights.

Question: [Simple question]

Please review our conversation history and:
- [First instruction]
- [Second instruction]
- Provide 3-5 actionable takeaways

Format your response with clear sections.
```

---

## Gemini (Google)

**Strengths**: Multimodal, factual accuracy, web integration, structured output

**Optimization Strategies**:
- Concise, specific instructions
- Benefits from explicit output format requests
- Use "Based on the conversation history" to ground responses
- Works well with bullet points and structured requests
- Effective with comparative analysis tasks
- Prefers clear scope definition

**Prompt Template**:
```
Task: [Introspection question]

Based on our conversation history, provide:

1. [First element]
2. [Second element]
3. [Third element]

Output format: [Specify structure - bullet points, table, etc.]
```

---

## Perplexity

**Strengths**: Research-focused, source citation, up-to-date information, concise answers

**Optimization Strategies**:
- Frame as research questions
- Benefits from "What patterns..." or "What trends..." phrasing
- Use "Based on our discussions about..." to provide context
- Prefers analytical over creative prompts
- Works well with comparative and evaluative tasks
- Best with specific, well-scoped questions

**Prompt Template**:
```
Research question: [Introspection question]

Context: Based on my recent AI conversations covering [topics].

Analyze and identify:
- [Key patterns or insights]
- [Connections or themes]
- [Recommended next steps]

Provide evidence-based insights with specific examples from our conversations.
```

---

## Cross-LLM Best Practices

1. **Always provide context** about what conversations to analyze
2. **Be specific** about output format and structure
3. **Use active verbs**: Analyze, identify, extract, summarize, compare
4. **Request actionable insights**, not just observations
5. **Specify scope**: Time range, topic areas, conversation types
6. **Ask for examples** to ground abstract insights

---

## Speech-Friendly Response Generation

### General Principles for TTS-Optimized Content

**Purpose**: Generate responses that sound natural when read aloud by text-to-speech engines (LLM native voice, ElevenLabs, etc.)

**Key Optimizations**:
1. **No Visual Formatting**: Remove all markdown, bullets, numbered lists
2. **Natural Flow**: Use conversational transitions and complete sentences
3. **Spell Out**: Acronyms on first use (API → "A P I" or "Application Programming Interface")
4. **Numbers**: Write out small numbers ("three" not "3"), use commas in large numbers
5. **Punctuation for Pauses**: Use periods, commas, dashes for natural breathing
6. **Avoid Special Characters**: No emojis, symbols, or visual separators
7. **Sentence Length**: Moderate length (15-20 words ideal) for natural pacing
8. **Pronunciation Hints**: Clarify ambiguous words when needed

### Adding to Initial Prompts

**Suffix to add when user wants speech-friendly response**:
```
After providing your analysis, also generate a "Speech-Friendly Version" that:
- Removes all formatting (no bullets, numbers, markdown)
- Uses natural, conversational language suitable for text-to-speech
- Flows as a continuous narrative with clear transitions
- Spells out acronyms and technical terms on first use
- Uses commas and periods for natural pauses
- Keeps sentences moderate length (15-20 words)

Label this section clearly as "Speech-Friendly Version:" at the end.
```

### Follow-Up Prompt for Existing Responses

**Template for converting any LLM response to speech-friendly format**:
```
Please convert your previous response into a speech-friendly version optimized for text-to-speech playback.

Requirements:
- Remove all markdown formatting, bullets, and numbered lists
- Convert to flowing, conversational narrative
- Use natural transitions between ideas ("First...", "Additionally...", "Finally...")
- Spell out acronyms and technical abbreviations
- Use complete sentences with natural pauses (commas, periods)
- Maintain all key insights and recommendations
- Keep sentences 15-20 words for optimal pacing

Format as a continuous text block that sounds natural when read aloud.
```

### LLM-Specific Speech Instructions

**Anthropic (Claude)**:
```
<output_format>
Provide two versions:
1. Standard formatted response
2. Speech-friendly version: Continuous narrative text, no formatting, optimized for TTS playback
</output_format>
```

**ChatGPT**:
```
At the end, provide a "For Audio Playback" section with your response rewritten as a continuous, naturally flowing narrative without any formatting—optimized for text-to-speech.
```

**Gemini**:
```
Output format:
1. Structured analysis (standard format)
2. Audio-ready version: Plain text narrative, no formatting, natural speech flow
```

**Perplexity**:
```
Include an "Audio Summary" at the end: A plain text, narrative version of your insights formatted for natural text-to-speech reading (no bullets, numbers, or formatting).
```

### Example Transformation

**Original (formatted)**:
```
Here are three key insights:
1. You've explored AI ethics extensively
2. Career focus: ML engineering
3. Next step: Build a portfolio project

Action items:
- Research ML frameworks
- Start a GitHub project
```

**Speech-Friendly**:
```
Based on your conversations, I've identified three key insights. First, you've explored AI ethics extensively, showing a deep interest in responsible technology development. Second, your career focus has clearly centered on machine learning engineering, with multiple discussions about algorithms and deployment strategies. Third, your next logical step appears to be building a portfolio project that demonstrates your skills.

As for action items, I'd recommend starting by researching popular ML frameworks that align with your interests, then launching a GitHub project where you can showcase your work publicly. This will give you both practical experience and visible proof of your capabilities.
```

## Implementation Notes

- Store base questions separately from LLM-specific optimizations
- Dynamically inject optimization patterns based on selected LLM
- User sees: "What's the craziest thing I've thought of so far?"
- Clipboard gets: Full optimized prompt with structure and explicit instructions
- Maintain simple question → optimized prompt mapping in code
- Add speech-friendly toggle in UI that injects TTS-specific instructions
