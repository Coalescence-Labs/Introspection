# Introspection - Design Vision

Awwwards-level design philosophy for a pared-down, visually impactful introspection tool.

## Core Philosophy

**Less is More. What Remains is BOLD.**

Introspection has fewer UI components than typical productivity apps (Notion, Google, Slack). This constraint is our superpower—each element can demand attention, take up space, and create impact.

## Visual Hierarchy

### The Question is the Hero

- **Font Size**: 48px - 72px for primary questions on desktop
- **Weight**: Bold or Extra Bold (700-800)
- **Line Height**: 1.2 - 1.3 for dramatic impact
- **Spacing**: Massive breathing room above and below
- Questions should feel like chapter titles, not UI labels

### Secondary Elements are Whispers

- LLM selector, copy button, metadata: 14px - 16px
- Soft, receded visual treatment
- Create contrast through scale, not color competition

## Layout Principles

### Generous Whitespace

- **Not cluttered, not dense, not efficient**
- 60-70% of screen can be empty space
- Centers focus on the question itself
- Mobile: Same principle applies—one thing at a time

### Centered, Focused Layouts

- Primary content centered on screen
- Max width: 900px for text readability
- Asymmetric elements used intentionally for visual interest
- No sidebars competing for attention

### Vertical Rhythm

- Large spacing between sections (80px - 120px)
- Creates breathing room and meditation-like quality
- Scrolling should feel intentional, not cramped

## Typography

### Font Strategy

- **Display Font**: Consider something expressive but readable
  - Options: Inter Display, SF Pro Display, Clash Display, Cabinet Grotesk
  - Used for questions and key headings

- **Body Font**: Clean, readable sans-serif
  - Options: Inter, SF Pro Text, Helvetica Neue
  - Used for descriptions, metadata, buttons

### Type Scale

```
Question (Hero):     48px - 72px (bold)
Section Heading:     32px - 40px (semibold)
Body Large:          18px - 20px (regular)
Body:                16px (regular)
Small/Meta:          14px (regular)
Tiny:                12px (regular)
```

## Color Strategy

### Minimal Palette

- **Background**: Pure white or very subtle warm/cool tint (#FAFAFA, #F8F9FA)
- **Text Primary**: Near-black (#1A1A1A, #2D2D2D)
- **Text Secondary**: Mid-gray (#6B6B6B, #808080)
- **Accent**: One bold color for interactive elements
  - Options: Deep purple, electric blue, vibrant orange
  - Used sparingly for buttons, highlights, selections

### Popping Visuals

- Use accent color strategically—when it appears, it POPS
- High contrast between background and foreground
- Consider subtle gradients for buttons/interactive elements
- Dark mode: Invert with care, maintain impact

## Interactive Elements

### Buttons

- **Large Touch Targets**: Minimum 48px height
- **Bold Typography**: 16px - 18px, semibold
- **Generous Padding**: 16px vertical, 32px horizontal
- **Subtle Animations**: Scale on hover (1.02x), smooth transitions
- Primary button: Solid accent color with high contrast text

### LLM Selector

- Visual cards, not dropdown
- Logo/icon + name
- Large, tappable areas (120px - 150px width)
- Selected state: Bold border or filled background
- Arranged horizontally on desktop, grid on mobile

### Copy Button

- Prominent but not competing with question
- Icon + "Copy Prompt" text
- Success state: Checkmark animation + "Copied!" feedback
- Position: Below question or floating bottom-right

### Speech-Friendly Toggle

- Simple checkbox with label: "Include speech-friendly version for TTS"
- Positioned between LLM selector and copy button
- Subtle presence (14px text, secondary color)
- Tooltip on hover: "Optimized for text-to-speech engines like ElevenLabs"
- Checked state: Accent color fill
- Adds TTS-specific instructions to copied prompt when enabled

## Animation & Motion

### Purposeful, Not Gratuitous

- **Page Transitions**: Smooth fade + subtle scale (300ms)
- **Question Changes**: Cross-fade with slight vertical movement
- **Button Interactions**: Scale, color shift (200ms ease-out)
- **Copy Feedback**: Checkmark bounce, color pulse
- No spinners—use skeleton states or instant feedback

### Micro-interactions

- Hover states that feel responsive
- Click/tap states that provide satisfying feedback
- Loading states that don't feel like waiting

## Responsive Design

### Mobile-First Mindset

- Touch targets: Minimum 44px
- Question text: 32px - 48px (still bold, scaled appropriately)
- Single column layouts
- Bottom sheet for LLM selection
- Thumb-friendly button placement

### Breakpoints

```
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
```

## Component Examples

### Home Screen

```
[Generous top spacing - 120px]

         "What's the craziest thing
          I've thought of so far?"
         [72px, bold, centered]

[80px spacing]

    [Claude] [ChatGPT] [Gemini] [Perplexity]
    [LLM selector cards, subtle borders]

[40px spacing]

    ☐ Include speech-friendly version for TTS
    [Checkbox, 16px text, subtle]

[60px spacing]

           [Copy Prompt to Clipboard]
           [Large button, accent color]

[Bottom: "Daily Question • Feb 10, 2026" in small gray text]
```

### Question Library View

```
[40px top spacing]

"Introspection Questions"
[40px, bold]

[60px spacing]

"Career & Growth" [24px, semibold]
  • What can I do to make the next step in my career?
  • What skills should I focus on developing?

[80px spacing]

"Ideas & Creativity" [24px, semibold]
  • What's the craziest thing I've thought of so far?
  • What patterns emerge in my thinking?

[Each question: 18px, click/tap to select]
```

## Inspiration References

- **Awwwards**: Linear, Stripe, Pitch, Arc Browser
- **Typography**: Apple product pages, Medium
- **Minimalism**: Notion calendar, Things 3
- **Bold Text**: Balenciaga, Supreme campaign sites
- **Interaction**: Stripe docs, Vercel

### Design Resources

Visual inspiration, reference screenshots, and design assets are stored in `/resources/`:
- Collect screenshots of inspiring UI/UX
- Typography examples showing bold, impactful text treatment
- Color palette references
- Layout and spacing examples
- Animation/interaction references
- Organized by category or inspiration source

## Implementation Notes

- Use modern CSS (Grid, Flexbox, Custom Properties)
- Consider Tailwind CSS for rapid development with custom config
- Framer Motion or similar for smooth animations
- System fonts as fallback for performance
- Dark mode toggle (respecting system preference)

## Success Criteria

A design succeeds when:
1. **The question feels important** — like something worth pondering
2. **Actions are obvious** — no hunting for buttons
3. **It feels calm** — not anxious or rushed
4. **It feels premium** — polished, intentional, crafted
5. **It works on any device** — mobile feels as good as desktop

---

**Remember**: We're designing for contemplation, not productivity. Every pixel should serve the moment of introspection.
