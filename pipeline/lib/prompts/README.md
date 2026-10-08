# Generator Prompt Chunks

This directory contains the system prompt pieces used by the pipeline question generators.

## Layout

- `chunks.ts`: shared chunk text plus prompt-specific chunks.
- `prompt.ts`: composes and exports `DAILY_GENERATOR_PROMPT` and `EXPANSIVE_GENERATOR_PROMPT`.
- `index.ts`: barrel export for the chunk constants and composed prompts.

## Naming

- Shared chunks have no suffix, for example `TONE`.
- Chunks used by only one prompt end in `_DAILY` or `_EXPANSIVE`.

## Consumers

- `DAILY_GENERATOR_PROMPT`: used by the daily generator and dry-run flow.
- `EXPANSIVE_GENERATOR_PROMPT`: used by `question-shell` and `run-bulk-questions`.

## Design standard

Both prompts put the purpose, introspective standard, and evidence boundaries before tone,
novelty, selection, and output requirements. A successful question seeks an interpretation of
how the user thinks or what they value, not just a summary of subjects they discussed.

The generator often receives only prior question texts, **not the user's conversation history**.
Those questions are novelty references, not evidence about the user. Generated questions must
therefore offer reusable, concrete evidence targets without pretending a personal pattern has
already been discovered. Actual interpretation happens later, against the user's history.

Key constraints:

- One evidence target and one interpretive task per question.
- Distinguish statements, intentions, and reported actions; none establishes hidden motives.
- Permit support, counterexamples, no pattern, or insufficient evidence.
- Do not infer avoidance or inaction from silence.
- Account for different circumstances before calling a difference a contradiction.
- Include strengths, commitments, and changes in understanding, not just deficits.
- Prefer self-insight and answerability before novelty or provocation.

## Research rationale

These are research-informed design choices, **not a validated psychological intervention**.
The cited work does not test LLM-generated questions answered from conversation histories;
the applications below are design extrapolations, not demonstrated effects of this prompt.

| Source | Relevant finding | Design application |
| --- | --- | --- |
| [Nisbett & Wilson (1977), *Telling More Than We Can Know*](https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Social_Cognition/Nisbett_Wilson_1977_Telling_more_than_we_can_know.pdf) | Verbal causal explanations can draw on plausible theories rather than direct access to the processes behind a judgment. | Ask for evidence-supported comparisons, not certainty about why the user "really" acted. This is not a claim that all introspection is unreliable. |
| [Wilson & Dunn (2004), *Self-Knowledge: Its Limits, Value, and Potential for Improvement*](https://www.annualreviews.org/content/journals/10.1146/annurev.psych.55.090902.141954) | This review argues that introspection alone cannot directly access many nonconscious processes; behavior and other perspectives can contribute to self-knowledge. | Compare explicit self-descriptions with concrete examples, while treating written reports as reports, not independently observed behavior. |
| [Trapnell & Campbell (1999), *Distinguishing Rumination From Reflection*](https://pubmed.ncbi.nlm.nih.gov/10074710/) | Four studies distinguish motivationally different forms of self-attention rather than treating all self-focus as one disposition. | Favor curiosity and neutral inquiry over repetitive, threat-focused self-judgment. The study does not validate particular question wordings. |
| [Watkins (2008), *Constructive and Unconstructive Repetitive Thought*](https://pmc.ncbi.nlm.nih.gov/articles/PMC2672052/) | This review identifies content, context, and processing style as moderators of repetitive thought's consequences. | Anchor interpretation in concrete examples and circumstances rather than global identity judgments. Abstract thought is not inherently harmful. |
| [Kross, Ayduk & Mischel (2005), *When Asking “Why” Does Not Hurt*](https://www.ocf.berkeley.edu/~rascl/assets/files/kross_etal_2005_ps.pdf) | In two experiments involving recalled anger, perspective and focus affected emotional processing; a distanced "why" condition differed from an immersed one. | Use an observant, non-accusatory stance. Do not categorically ban "why" questions. These emotion-processing results do not establish factual accuracy or benefits for this application. |

## Validation

`bun test pipeline/lib/prompts pipeline/lib/llm.test.ts` checks prompt assembly, example lengths,
schema-aligned field instructions, and the prompts passed to the mocked model. Static tests
cannot establish that generated questions reliably produce self-insight.

For a model-quality evaluation, compare old and new outputs under the same model and context,
then answer the questions against consented or synthetic histories. Review whether each answer
produces a supported self-interpretation rather than a topic recap, whether the question permits
counterexamples or insufficient evidence, and whether context changes explain apparent tensions.
Include sparse histories and histories with no contradiction so that a question cannot score
well merely by eliciting a plausible accusation.
