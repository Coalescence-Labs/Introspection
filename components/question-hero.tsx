import styles from "./question-hero.module.css";

interface QuestionHeroProps {
  question: string;
}

export function QuestionHero({ question }: QuestionHeroProps) {
  return (
    <div
      className={`question-hero text-center h-full flex items-center justify-center overflow-hidden shrink-0 ${styles.hero}`}
    >
      <h1 className="font-serif text-[clamp(2.125rem,5vw,4rem)] leading-[1.15] tracking-[-0.02em] text-foreground w-full min-h-[3.45em] flex items-center justify-center">
        {question}
      </h1>
    </div>
  );
}
