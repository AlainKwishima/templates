---
name: expo-web-app
description: Build the web target for this Expo SDK 56 template — sidebar layout, Radix UI menus, responsive breakpoints, and shared routes with Android. Use when implementing web layouts, desktop UI, hover states, or verifying in the browser. Triggers on web, browser, desktop, responsive, sidebar, Radix, md breakpoint.
---

# Expo Web App Development

## Platform Scope

**Web is an active target** alongside Android. iOS is out of scope unless requested.

- Platform check: `process.env.EXPO_OS === "web"`
- Prefer Uniwind `web:` prefix over `Platform.select` when styling differs
- Shared routes live in `src/app/` — web-specific root layout in `_layout.web.tsx`

## Stack (Web-Specific)

| Layer | Choice |
|-------|--------|
| Layout | `src/app/_layout.web.tsx` — sidebar + inset content panel |
| Navigation UI | `src/components/sidebar.web.tsx` |
| Menus / tooltips | Radix UI (`@radix-ui/react-context-menu`, `dropdown-menu`, `tooltip`) |
| Icons | `lucide-react` in web-only components; `@/components/icon` in shared screens |
| Styling | Same Uniwind tokens + Tailwind responsive prefixes (`md:`, `lg:`) |
| Output | `app.json` → `"web": { "output": "server" }` |

## Layout Architecture

```
_layout.web.tsx
├── Sidebar (collapsible rail on md+, slide-over on mobile)
└── Main column
    ├── Top bar (mobile toggle, desktop actions)
    └── Inset panel (rounded on md+) → <Slot /> for route content
```

Screens in `src/app/*.tsx` render inside the inset panel — no duplicate web routes needed unless behavior diverges.

## Responsive Patterns

Mobile-first — base styles for phone, enhance at breakpoints:

```tsx
{/* Hidden on desktop, visible on mobile */}
<View className="md:hidden">
  <SidebarToggle onPress={open} />
</View>

{/* Desktop-only actions */}
<View className="hidden md:flex md:flex-row md:items-center md:gap-2">
  {/* ... */}
</View>

{/* Inset panel styling at tablet+ */}
<View className="md:rounded-tl-xl md:border-t md:border-l md:border-border/40">
```

| Prefix | Min width | Typical use |
|--------|-----------|-------------|
| (none) | 0 | Mobile sidebar overlay |
| `md:` | 768px | Collapsed sidebar rail, inset panel |
| `lg:` | 1024px | Wider content columns |

Use `h-dvh` / `min-h-0` for full-viewport layouts that scroll correctly.

## Web Interactions

Uniwind supports web-only states on shared components:

```tsx
<Pressable className="rounded-lg bg-secondary active:bg-muted hover:bg-accent">
```

- `hover:` — pointer hover (web)
- `active:` — press (all platforms)
- `cursor-default` — on Radix menu items (see sidebar)

Prefer `hover:` on web for affordance; keep `active:` for Android parity in shared components.

## Radix UI Pattern

Web-only components use Radix with Tailwind classes matching template tokens:

```tsx
const MENU_CONTENT_CLASS =
  "z-[100] min-w-[180px] rounded-xl bg-card p-1.5 shadow-float border border-border/40 animate-fade-up";

const MENU_ITEM_CLASS =
  "flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground outline-none data-[highlighted]:bg-accent";
```

Use Radix for: context menus, dropdowns, tooltips. On Android, use `Alert.alert`, overflow menus, or inline actions instead.

## Platform Files

| File | Purpose |
|------|---------|
| `src/app/_layout.web.tsx` | Web root — sidebar shell |
| `src/app/_layout.tsx` | Native — drawer + stack |
| `src/components/sidebar.web.tsx` | Web navigation |
| `src/components/blur-raw.web.tsx` | Web blur fallback |

Metro resolves `*.web.tsx` automatically on web builds. Do not import `.web` files directly.

## Shared vs Web-Only Code

**Keep shared** (works on Android + web):
- Screen content (`index.tsx`, `items.tsx`, settings)
- Design tokens and `className` styling
- Data fetching, forms, business logic

**Split when needed**:
- Root navigation shell (drawer vs sidebar)
- Context menus (Link.Menu on native vs Radix on web)
- Platform-specific headers/toolbars

Example guard in shared code:

```tsx
if (process.env.EXPO_OS === "web") {
  // optional web-only branch
}
```

Prefer platform files over inline guards when the divergence is large.

## Verification

```bash
bun run web          # Expo web dev server
npx agent-browser    # Agent/browser verification
```

Web does **not** require a custom native build. Hot reload works with standard Expo web.

## Do Not

- Use SF Symbols or iOS Liquid Glass APIs on web
- Use `withUniwind` on core RN components
- Duplicate entire screens as `screen.web.tsx` unless layout truly cannot be shared
- Use `div` / `img` — stay on React Native primitives (`View`, `Text`, `Pressable`)
- Forget responsive testing at `md:` breakpoint (sidebar collapse behavior)

## References

- Design tokens: [../mobile-app-design/design-tokens.md](../mobile-app-design/design-tokens.md)
- Android native: [../android-expo-app/SKILL.md](../android-expo-app/SKILL.md)
- Uniwind breakpoints: [../uniwind/SKILL.md](../uniwind/SKILL.md)
