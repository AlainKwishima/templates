# Design Tokens Reference

Source: `src/global.css`. All colors use OKLCH for perceptual consistency across light/dark.

## Semantic Tokens → Tailwind

| CSS variable | Tailwind class examples |
|--------------|-------------------------|
| `--app-background` | `bg-background` |
| `--app-foreground` | `text-foreground` |
| `--app-card` | `bg-card` |
| `--app-muted` | `bg-muted` |
| `--app-muted-foreground` | `text-muted-foreground` |
| `--app-border` | `border-border`, `bg-border` |
| `--app-secondary` | `bg-secondary` |
| `--app-accent` | `bg-accent` |
| `--app-sidebar` | `bg-sidebar` |
| `--app-shadow-card` | `shadow-card` |
| `--app-shadow-float` | `shadow-float` |

## Light Theme Values (reference)

| Token | OKLCH | Role |
|-------|-------|------|
| background | oklch(0.985 0 0) | Near-white canvas |
| foreground | oklch(0.12 0 0) | Primary text |
| card | oklch(1 0 0) | Elevated surface |
| muted | oklch(0.955 0 0) | Subtle fill |
| muted-foreground | oklch(0.55 0 0) | Secondary text |
| border | oklch(0.88 0 0) | Dividers |
| secondary | oklch(0.96 0 0) | Cards, chips |
| accent | oklch(0.94 0 0) | Highlight |
| sidebar | oklch(0.97 0 0) | Drawer background |

## Dark Theme

Background shifts to oklch(0.195 0 0); foreground to oklch(0.94 0 0). All variants define the same keys — required by Uniwind.

## Adding Brand Colors

1. Add `--app-primary` (and dark variant) in both `@variant light` and `@variant dark`
2. Map in `@theme`: `--color-primary: var(--app-primary);`
3. Use `bg-primary`, `text-primary`, `accent-primary` on components

## Animation Token

`--animate-fade-up` — entrance animation utility. Use for content appearing on screen load.

## Custom Utilities

- `border-continuous` — `{ borderCurve: 'continuous' }` for smoother corners (see template usage)
- Sidebar web-only hover utilities in global.css — ignore for Android work

## JS Access

When a native API needs a raw color string:

```tsx
import { useCSSVariable } from "uniwind";

const fg = useCSSVariable("--app-foreground") as string;
const bg = useCSSVariable("--app-background") as string;
```

Used in `src/app/_layout.tsx` for stack header colors.
