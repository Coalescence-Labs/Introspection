"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { welcome as s } from "./welcome-styles";

export function WelcomeContent() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col px-6">
      <section className="snap-start flex flex-col justify-around flex-1 relative min-h-dvh pt-20 pb-[14rem] sm:pt-32">
        {/* Hero text block: overlay (middle) sits above particles, below text/button */}
        <div className="relative mx-auto flex flex-1 w-full max-w-[900px] flex-col items-center justify-center text-center select-none">
          {/* Radial gradient overlay for text contrast — does not intercept clicks */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.6)_45%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.45)_45%,rgba(0,0,0,0)_70%)]"
          />
          <div className="relative z-10 flex flex-1 w-full flex-col items-center justify-center">
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
      </section>
      <section className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto w-full max-w-[1200px] flex flex-col items-center justify-center">
          <div className={s.card}>
            <h2 className={`${s.sectionTitle} mb-8`}>
              Your Conversations Already Contain Structure
            </h2>
            <p className={`${s.bodyLarge} mx-auto mb-6 max-w-xl`}>
              If you use AI often, you've created:
            </p>
            <ul className={`${s.listCenter} mb-10`}>
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
                className={`${s.quote} mx-auto mb-10 max-w-xl translate-x-10`}
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
      </section>
      <section className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.4, delayChildren: 0.4 } },
          }}
          className={`${s.card} mx-auto flex flex-col items-center justify-center`}
        >
          <h2 className={`${s.sectionTitle} mb-10`}>How It Works</h2>
          <ol className={`${s.listSteps} mb-12`}>
            <motion.li
              variants={{
                hidden: { opacity: 0, x: 70 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
              }}
            >
              Choose a reflection prompt
            </motion.li>
            <motion.li
              variants={{
                hidden: { opacity: 0, x: 70 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
              }}
            >
              Copy & Paste into your preferred LLM
            </motion.li>
            <motion.li
              variants={{
                hidden: { opacity: 0, x: 70 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
              }}
            >
              Receive a structured analysis
            </motion.li>
          </ol>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 70 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className={`${s.body} space-y-2`}
          >
            <p>Model-agnostic.</p>
            <p>Privacy-forward.</p>
            <p>Lightweight by design.</p>
          </motion.div>
        </motion.div>
      </section>
      <section className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
          <h2 className={`${s.sectionTitle} mb-10`}>The Result</h2>
          <div className={`${s.body} mb-10 space-y-2`}>
            <p>Clarity.</p>
            <p>Integration.</p>
            <p>Durable insight.</p>
          </div>
          <p className={`${s.body} mb-4`}>You've already done the thinking.</p>
          <p className={s.body}>Now see it.</p>
        </div>
      </section>
      <section className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
          <h2 className={`${s.sectionTitle} mb-6`}>Ready to reflect?</h2>
          <p className={`${s.body} mb-10 max-w-xl`}>
            Start with a question designed to surface what's already in your conversations.
          </p>
          <Link href="/today" className={s.ctaSecondary} prefetch={true}>
            Try a question
          </Link>
        </div>
      </section>
    </main>
  );
}
