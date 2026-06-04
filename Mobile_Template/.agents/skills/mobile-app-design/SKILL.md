---
name: mobile-app-design
description: Design polished Android and web UI — layout, typography, color, spacing, responsive breakpoints, and screen composition using this template's OKLCH tokens and Material Design 3 principles. Use when designing screens, choosing visual hierarchy, creating components, improving UX, wireframing, or reviewing UI quality.
---

# Mobile App Design

## Scope

Design for **Android and web** using this template's design system. Android is the primary touch target; web adds sidebar layout and `md:`+ responsive behavior. Output should be implementable with Uniwind `className` and tokens from `src/global.css`.

When designing, read [design-tokens.md](design-tokens.md) for the token map and type scale.

## Design Principles

1. **Clarity over decoration** — one primary action per screen; reduce visual noise
2. **Consistent rhythm** — repeat spacing, corner radii, and row heights across screens
3. **Semantic color** — use tokens (`background`, `foreground`, `muted`, `border`), not raw hex in components
4. **Touch-first (Android)** — 48dp minimum targets; on web add `hover:` affordance and pointer-sized click areas
5. **Readable hierarchy** — size + weight + color, not color alone
6. **Forgiving layouts** — flex, scroll, truncate with `numberOfLines`; avoid fixed pixel heights for text blocks

## Typography Scale (Template)

| Role | Size | Weight | Class pattern |
|------|------|--------|---------------|
| Display / hero | 28px | bold | `text-[28px] font-bold text-foreground` |
| Title / nav | 17px | medium–semibold | `text-[17px] font-medium text-foreground` |
| Body | 15–17px | normal | `text-[17px] text-foreground` |
| Secondary | 13–15px | normal | `text-[13px] text-muted-foreground` |
| Section label | 13px | semibold uppercase | `text-[13px] font-semibold uppercase tracking-wider text-muted-foreground` |

Line height: add `leading-snug` on multi-line subtitles.

## Spacing System

Base unit **4px**. Common values:

| Use | Class |
|-----|-------|
| Screen horizontal padding | `px-5` (20px) |
| Section gap | `gap-3` / `mt-8` between sections |
| List row padding | `px-5 py-3.5` or `py-4` |
| Icon–text gap | `gap-3.5` or `gap-4` |
| Card inner padding | `px-4 py-3` |
| Corner radius — card | `rounded-xl` (12px) |
| Corner radius — chip/icon bg | `rounded-full` or `rounded-2xl` |

Prefer `gap-*` over margin chains.

## Color Usage

| Token | Use |
|-------|-----|
| `background` | Page canvas |
| `foreground` | Primary text, icon default |
| `muted` | Subtle fills, pressed states, icon circles |
| `muted-foreground` | Secondary text, chevrons, hints |
| `secondary` | Tappable cards, quick links |
| `card` | List row hover/press, overlays |
| `border` | Dividers, outlines |
| `accent` | Selected/highlight backgrounds |

Accent colors (brand): extend `@theme` in `global.css` — don't hardcode in screens.

Dark mode: tokens auto-switch via `@variant dark`. Avoid manual `dark:` unless one-off.

## Component Recipes

### Quick link card

Icon in circle + title + subtitle + chevron. Background `bg-secondary`, press `active:bg-muted`, `rounded-xl`.

### List row

Leading optional icon → title + subtitle stack → trailing chevron or metadata. Full width, `active:bg-muted`.

### Settings group

Rows with leading icon (20px), label, optional trailing detail text, chevron. Separate groups with `h-px bg-border mx-5`.

### Hero block

Large icon/badge → headline → supporting text. Top of home/discovery screens. `px-5 pt-4 pb-6`.

### FAB / primary action

Circular `bg-foreground` with inverted icon, or filled pill button. One per screen max.

## Screen Composition Checklist

When designing a new screen:

```
- [ ] Single clear purpose (title in stack header, not duplicated in body)
- [ ] Primary content scrolls (ScrollView / FlatList first child)
- [ ] Bottom safe area (`android:pb-safe`)
- [ ] Empty state designed (icon + message + optional action)
- [ ] Loading state (skeleton or spinner with `colorClassName="accent-..."`)
- [ ] Error state (selectable message + retry)
- [ ] Touch targets ≥ 48dp on all interactives
- [ ] Truncation rules for long text (titles 1 line, subtitles 1–2)
```

## Visual Hierarchy Workflow

1. **Structure** — sections top to bottom: hero → actions → content → meta
2. **Priority** — largest/boldest = most important; mute secondary info
3. **Grouping** — related items share background or divider boundaries
4. **Affordance** — chevrons, opacity on press, icons on tappable rows
5. **Polish** — consistent icon sizes (16–24px), aligned baselines, equal row heights

## Icons

- Style: Lucide outline, `strokeWidth` 2 default (4 for grabber)
- Sizes: `w-4 h-4` inline, `w-5 h-5` row leading, `w-6 h-6` toolbar
- Color: match text role (`text-foreground` / `text-muted-foreground`)
- Semantic: yellow for star, destructive actions use `Alert` not red icons unless brand requires

## Shadows & Depth

Template uses CSS `boxShadow` via tokens:

- `shadow-card` — subtle cards
- `shadow-float` — drawers, floating elements

On Android prefer flat surfaces; use shadow sparingly.

## Responsive Web Layout

When a screen is shared between Android and web:

| Android | Web (md+) |
|---------|-----------|
| Drawer navigation | Persistent sidebar rail |
| Full-width content | Inset panel with `rounded-tl-xl` |
| Stack header title | Same content; top bar in `_layout.web.tsx` |
| Edge-to-edge lists | Optional max-width container for readability |

Design mobile layout first, then enhance — not the reverse:

```tsx
<View className="px-5 md:px-8 lg:max-w-3xl lg:mx-auto">
```

Hide mobile-only chrome: `md:hidden`. Show desktop actions: `hidden md:flex`.

## Anti-Patterns

- Duplicating stack title as large page heading
- More than two font sizes in one row
- Raw `#hex` in components instead of tokens
- Tiny touch targets (icon-only without padding)
- Dense walls of text without section breaks
- iOS-only patterns (SF Symbols, swipe-back hints, translucent nav)
- Desktop-first layouts that break on Android drawer screens
- Dynamic Tailwind class construction

## Handoff to Code

When implementing a design:

1. Map colors → semantic tokens
2. Map spacing → Tailwind scale above
3. Extract repeated patterns → `src/components/`
4. Use existing screens as reference: `index.tsx`, `items.tsx`, `(settings)/settings.tsx`

## References

- Token map & OKLCH: [design-tokens.md](design-tokens.md)
- Android implementation: [../android-expo-app/SKILL.md](../android-expo-app/SKILL.md)
- Web implementation: [../expo-web-app/SKILL.md](../expo-web-app/SKILL.md)
- Uniwind styling: [../uniwind/SKILL.md](../uniwind/SKILL.md)
