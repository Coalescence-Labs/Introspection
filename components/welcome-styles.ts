/**
 * Centralized Tailwind class strings for the welcome page.
 * Kept in a .ts file under components/ so Tailwind's @source scan includes them (tree-shaking).
 */
export const welcome = {
  hero: {
    label:
      "mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground",
    headline:
      "mb-6 text-[clamp(3rem,8vw,4.5rem)] font-medium leading-[1.4] tracking-[-0.02em] text-[#111] dark:text-foreground",
    subtext:
      "mb-10 max-w-2xl text-lg font-normal leading-relaxed text-[#444] dark:text-foreground/85 sm:text-xl",
    cta:
      "hero-cta inline-flex h-12 min-w-[200px] items-center justify-center rounded-md bg-accent px-10 py-5 text-base font-semibold text-accent-foreground transition-all duration-[250ms] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-lg",
    footer:
      "absolute bottom-4 left-0 right-0 z-10 text-center text-sm font-light text-[#555] dark:text-muted-foreground/85",
  },
  card:
    "w-full max-w-4xl rounded-2xl border border-border/50 bg-foreground/[0.02] px-8 py-10 text-center backdrop-blur-sm sm:px-12 sm:py-12",
  sectionTitle:
    "text-3xl sm:text-4xl font-bold leading-tight text-foreground sm:text-4xl",
  body: "text-xl font-normal leading-relaxed text-foreground/80",
  bodyEmphasis: "text-xl font-normal leading-tight text-foreground/95",
  bodyLarge: "text-lg sm:text-2xl font-normal leading-relaxed text-foreground/95",
  listCenter:
    "mx-auto max-w-xl space-y-2 text-base sm:text-lg font-normal leading-relaxed text-foreground/95 flex flex-col items-center justify-center text-foreground/80",
  listSteps:
    "mx-auto max-w-xl list-inside list-decimal space-y-10 text-left text-xl md:text-2xl font-normal leading-relaxed text-foreground/80",
  quote: "text-xl italic font-normal text-foreground",
  ctaSecondary:
    "inline-flex h-12 min-w-[200px] items-center justify-center rounded-md bg-accent px-10 py-5 text-base font-semibold text-accent-foreground shadow-sm transition-all duration-[250ms] hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-lg select-none",
} as const;
