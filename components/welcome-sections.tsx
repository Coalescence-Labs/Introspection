"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { welcome as s } from "./welcome-styles";
import { cn } from "@/lib/utils";

export function WelcomeHeroSection() {
  return (
    <>
      <div className="relative mx-auto flex flex-1 w-full max-w-[900px] flex-col items-center justify-center text-center select-none">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.6)_45%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.45)_45%,rgba(0,0,0,0)_70%)]"
        />
        <div className="z-10 flex flex-1 w-full flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={s.hero.label}
          >
            INTROSPECTION
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={s.hero.headline}
          >
            Turn AI conversations into lasting insights
          </motion.h1>

          <div className="flex flex-col gap-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={s.hero.subtext}
            >
              Questions designed to surface what's hidden in your past conversations.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={s.hero.subtext}
            >
              Works with any LLM — just copy, paste, and look closer.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/today" tabIndex={0} className={s.hero.cta} prefetch={true}>
              Try a question
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className={s.hero.footer}
      >
        Built by an independent developer, not a data company
      </motion.p>
    </>
  );
}

export function WelcomeStructureSection() {
  return (
    <div className="mx-auto w-full max-w-[1200px] flex flex-col items-center justify-center">
      <div className={s.card}>
        <h2 className={`${s.sectionTitle} mb-8`}>
          Your Conversations Already Contain Structure
        </h2>
        <p className={`${s.bodyLarge} mb-4 mx-auto max-w-xl`}>
          If you use AI often, you've created:
        </p>
        <ul className={`${s.listCenter} mb-8 sm:mb-10`}>
          <li>emerging themes</li>
          <li>repeated ideas</li>
          <li>implicit goals</li>
          <li>evolving preferences</li>
          <li>unresolved tensions</li>
        </ul>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.4, delayChildren: 0.4 } },
          }}
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, x: 70 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
            }}
            className={`${s.quote} mx-auto mb-3 max-w-xl -translate-x-10`}
          >
            But conversations fade.
          </motion.p>
          <motion.p
            variants={{
              hidden: { opacity: 0, x: -70 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
            }}
            className={`${s.quote} mx-auto mb-8 sm:mb-10 max-w-xl translate-x-10`}
          >
            Patterns remain hidden.
          </motion.p>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 70 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className={`${s.bodyEmphasis} mx-auto max-w-xl`}
          >
            Introspection brings coherence to what already exists.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

const steps = [
  { num: 1, title: "Choose a reflection prompt" },
  { num: 2, title: "Copy & paste into your preferred LLM" },
  { num: 3, title: "Receive a structured analysis" },
];

const stepVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function WelcomeHowItWorksSection() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.12, delayChildren: 0.1 },
        },
      }}
      className={`${s.card} mx-auto flex max-w-3xl flex-col items-center justify-center`}
    >
      <motion.h2
        variants={stepVariants}
        className={`${s.sectionTitle} mb-14 text-center`}
      >
        How It Works
      </motion.h2>

      <ol className="grid w-full gap-4 sm:grid-cols-3 sm:gap-6">
        {steps.map((step, i) => (
          <motion.li
            key={step.num}
            variants={stepVariants}
            className="group flex flex-col items-center text-center sm:items-center sm:text-center"
          >
            <span
              className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/5 text-lg font-semibold text-accent transition-colors group-hover:border-accent/60 group-hover:bg-accent/10 dark:border-accent/40 dark:bg-accent/10 dark:group-hover:border-accent/70 dark:group-hover:bg-accent/20"
              aria-hidden
            >
              {step.num}
            </span>
            <span className="text-base font-medium leading-snug text-foreground/90 sm:text-lg">
              {step.title}
            </span>
          </motion.li>
        ))}
      </ol>

      <motion.div
        variants={stepVariants}
        className="mt-12 flex max-w-[300px] sm:max-w-full w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_auto_auto_1fr] sm:place-items-center sm:gap-x-2 sm:gap-y-0"
      >
        <span className="sm:justify-self-end">Model-agnostic</span>
        <span className="text-muted-foreground/50 sm:justify-self-end">·</span>
        <span>Privacy-forward</span>
        <span className="text-muted-foreground/50 sm:justify-self-start hidden sm:inline">·</span>
        <span className="sm:justify-self-start">Lightweight by design</span>
      </motion.div>
    </motion.div>
  );
}

export function WelcomeResultSection() {
  return (
    <div className={`${s.card} mx-auto flex max-w-[900px] flex-col items-center justify-center text-center`}>
      <h2 className={`${s.sectionTitle} mb-10`}>The Result</h2>
      <div className={`${s.body} mb-12 space-y-6`}>
        <p>Clarity.</p>
        <p>Integration.</p>
        <p>Durable insight.</p>
      </div>
      <p className={cn(s.body, `mb-3 leading-tight text-lg`)}>You've already done the thinking.</p>
      <p className={cn(s.body, `leading-tight font-extralight`)}>Now see it.</p>
    </div>
  );
}

export function WelcomeCtaSection() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
      <h2 className={`${s.sectionTitle} mb-6`}>Ready to reflect?</h2>
      <p className={`${s.bodyEmphasis} mb-10 max-w-xl font-medium`}>
        Start with a question designed to surface what's already in your conversations.
      </p>
      <Link href="/today" className={s.ctaSecondary} prefetch={true}>
        Try a question
      </Link>
    </div>
  );
}

export const welcomeSections = [
  WelcomeHeroSection,
  WelcomeStructureSection,
  WelcomeHowItWorksSection,
  WelcomeResultSection,
  WelcomeCtaSection,
] as const;
