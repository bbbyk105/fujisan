---
name: design-system
description: Invoke when creating, reviewing, or refactoring any UI component in command-center/ or src/ to enforce the house design system. Use this skill BEFORE writing new JSX to ensure tokens, spacing, motion, and typography match the established visual language. Also use when asked to do a design review, make something "more polished", "more premium", or "match the style".
---

# Command Center — Design System

This skill enforces the visual and interaction language of the Command Center. Read this before touching any UI file.

## Design Tokens (Immutable)

### Color Ramp

```
ink.950  #0a0a0f   darkest background
ink.900  #111118   main background
ink.800  #1a1a24   elevated panel
ink.700  #24242f   hover surface
ink.600  #33333f   input fill
ink.500  #4a4a55   disabled
ink.400  #7a7a82   tertiary text
ink.300  #a8a8b0   secondary text
ink.200  #d0d0d5   primary text (on dark)
ink.100  #eaeaee   high emphasis
accent   #c9a96a   THE accent — used < 5% of pixels
panel    rgba(26,26,36,0.72) + backdrop-blur-xl
```

Semantic (use sparingly):
- success: `emerald-400/500`
- warning: `accent` (yes, same as brand — gold is urgent)
- error: `red-400/500` or `#e56b6f`
- info: `sky-400/500`

### Type Scale

```
10px — micro labels (uppercase + 0.2em tracking)
11px — meta / status pills
12px — captions, timestamps
13px — dense tables only (avoid)
14px — body default
15px — emphasized body
16px — section titles
20px — card titles
24px — page sub-headers
30px — page heros
```

Fonts: `Inter, "Noto Sans JP", system-ui`
Weights: `400` (default), `500` (emphasis), `600` (titles), `700` (hero only)

### Spacing

Base unit: **4px**. All margins/paddings are multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
Avoid: 6, 10, 14, 18 — these are "smells".

### Corners

```
4px  — inputs, badges, pills
8px  — buttons, small cards
12px — none (forbidden)
16px — panels
24px — page containers (rare)
```

### Motion

```
150ms  ease-out    — micro (hover, focus, press)
250ms  ease-out    — small transitions (menu open)
300ms  cubic-bezier(0.22, 1, 0.36, 1) — enters (slide-up, fade-in)
2000ms infinite    — pulse (live indicators only)
```

Never use: `transition-all` without a duration. Never animate color on scroll. Never bounce.

## Component Patterns

### Panel (the universal container)

```tsx
<div className="rounded-2xl border border-white/5 bg-panel backdrop-blur-xl">
  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
    {/* header */}
  </div>
  <div className="p-5">{/* body */}</div>
</div>
```

### Primary button

```tsx
<button className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium
                   bg-accent text-ink-950 hover:bg-accent-hover transition-colors duration-150">
  <Icon size={14} />
  Label
</button>
```

### Live status dot

```tsx
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
```

### Data flow edge (SVG)

```svg
<path d="..." stroke="url(#flow-gradient)" stroke-width="1.5" fill="none" />
<circle r="2" fill="#c9a96a">
  <animateMotion dur="2s" repeatCount="indefinite" path="..." />
</circle>
```

## Audit Checklist

Before shipping any UI change, verify:

- [ ] No ad-hoc hex colors (only tokens)
- [ ] No ad-hoc spacing values (only 4px multiples)
- [ ] Single accent per screen (gold appears < 5% of pixels)
- [ ] Max 3 text sizes per component
- [ ] Max 2 font weights per component
- [ ] All interactive elements have hover + focus states
- [ ] All motion ≤ 300ms (except pulse)
- [ ] Dark mode only (no light-mode overrides needed — we're always dark)
- [ ] Icons are `lucide-react`, size 12/14/16/20 only
- [ ] Text on accent background is `ink-950` (never white)
- [ ] Text on panel background is `ink-100` (primary) or `ink-300` (secondary)

## Red Flags

If you see any of these, STOP and refactor:

- `shadow-xl` or `shadow-2xl` on static elements (shadows are for lift only)
- `text-white` anywhere (use `text-ink-100`)
- `bg-gray-*` anywhere (use `bg-ink-*`)
- Gradient text (`bg-clip-text text-transparent`)
- More than 3 border radii in one component
- Emoji in buttons (use lucide icons)
- Inline `style={{...}}` for anything non-dynamic
- `transition-all` without specific properties

## When in Doubt

Invoke the `ui-designer` agent for a design pass. Do NOT invent a new style — the system is the style.
