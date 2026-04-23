import styles from "./question-hero.module.css";

interface QuestionHeroProps {
  question: string;
}

/** Large, centered question text with a CSS entrance animation (0.6s). Server component; no client JS. */
export function QuestionHero({ question }: QuestionHeroProps) {
  return (
    <div
      className={`question-hero text-center h-full flex items-center justify-center overflow-hidden shrink-0 ${styles.hero}`}
    >
      <h1 className="flex min-h-[3.45em] w-full cursor-text select-text items-center justify-center font-serif text-[clamp(2.125rem,5vw,4rem)] leading-[1.15] tracking-[-0.02em] text-foreground">
        {question}
      </h1>
    </div>
  );
}
