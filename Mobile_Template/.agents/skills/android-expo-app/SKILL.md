---
name: android-expo-app
description: Build Android apps with this Expo SDK 56 template — drawer navigation, Uniwind styling, custom dev builds, and Android-specific UI patterns. Use when implementing native mobile screens, navigation, or debugging on Android. For web, use expo-web-app skill. Triggers on Android, Material Design, emulator, APK, drawer, toolbar, back gesture.
---

# Android Expo App Development

## Platform Scope

**Primary native target.** Web is also supported — see `expo-web-app` skill. Skip iOS unless explicitly requested.

- Prefer `process.env.EXPO_OS === "android"` over `Platform.OS`
- Use platform files: `component.android.tsx` / `component.web.tsx` when behavior diverges
- Skip iOS-only APIs: Liquid Glass, SF Symbols, `@expo/ui` SwiftUI, modal presentation, large titles
- Use **Lucide** icons via `@/components/icon`, not `expo-image` SF sources
- Shared screen code should work on both Android and web unless a platform file overrides it

## Stack (This Template)

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 56, React Native 0.85, React 19 |
| Navigation | Expo Router file routes in `src/app/` |
| Styling | Uniwind (Tailwind v4) + tokens in `src/global.css` |
| Icons | `lucide-react-native` wrapped in `@/components/icon` |
| Gestures | `react-native-gesture-handler`, `react-native-reanimated` |
| Keyboard | `react-native-keyboard-controller` |
| Safe area | `react-native-safe-area-context` + `Uniwind.updateInsets` |

## Project Layout

```
src/
  app/           # Routes only — no co-located components
  components/    # Reusable UI
  utils/         # Helpers, cn(), mock data
  global.css     # OKLCH design tokens → Tailwind classes
```

Path alias: `@/*` → `./src/*`

## Verification

**Default: Expo Go on Android.** Start the dev server and open in the Expo Go app (device or emulator with Expo Go installed).

```bash
bun install
bun start                # Scan QR with Expo Go — primary test loop
bun run android          # Custom dev build when Expo Go is not enough
bun run web              # Web target
```

### When Expo Go is enough

Most template features work in Expo Go: Expo Router, Uniwind, drawer, Reanimated gestures, Lucide icons, keyboard controller, blur fallbacks (Liquid Glass falls back automatically).

### When you need a dev build (`bun run android`)

- A new native dependency is **not** bundled in Expo Go
- Uniwind Pro or other packages that require native rebuild
- Final QA before store builds
- Debugging native-only issues

Add native deps with `bunx expo install <package>`, then test in Expo Go first; build only if the module requires it.

## Android Navigation Patterns

### Root layout

- `src/app/_layout.tsx`: drawer + stack (native mobile layout)
- Drawer: `DrawerLayout` (gesture from left edge) + `DrawerContent`
- Settings opens as a **stack screen**, not iOS modal (`presentation: undefined` on Android)

### Toolbar buttons

Android uses `Stack.Toolbar` with `asChild` + `Pressable` + Lucide icons until unified toolbar support lands:

```tsx
<Stack.Toolbar placement="left" asChild>
  <Pressable
    onPress={openDrawer}
    accessibilityLabel="Open drawer"
    accessibilityRole="button"
    className="p-2 -ml-1 active:opacity-60"
  >
    <Icon icon={Menu} className="w-6 h-6 text-foreground" />
  </Pressable>
</Stack.Toolbar>
```

### Headers

Android stack headers use solid background from theme tokens:

```tsx
headerTransparent: false  // implied when GLASS unavailable
headerShadowVisible: false
headerStyle: { backgroundColor: appBackground }
headerTintColor: appForeground
```

### Back navigation

`app.json` sets `predictiveBackGestureEnabled: false`. Respect Android back with Expo Router stack; avoid custom back handlers unless needed.

## Styling Rules (Uniwind)

Read the `uniwind` skill for full API. Android essentials:

- **Pressable**: use `className` + `active:` — never `style={({ pressed }) => ...}`
- **Tokens**: `bg-background`, `text-foreground`, `bg-muted`, `border-border`, etc.
- **Safe area**: `android:pb-safe`, `pt-safe` on scroll content
- **Icons on Switch/ActivityIndicator**: `colorClassName="accent-primary"` (accent- prefix)
- **Third-party**: wrap once in `@/components/tw.tsx` with `withUniwind` — never wrap core RN components
- **Deduplication**: `cn()` from `@/utils/tailwind` when mixing custom CSS classes with utilities

### Android font note

`global.css` sets `--font-sans: normal` on Android. Prefer system default; load custom fonts via `expo-font` plugin if branding requires it.

## Screen Structure

Every scrollable route should follow:

```tsx
export default function Screen() {
  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="android:pb-safe"
      >
        {/* content */}
      </ScrollView>
      {/* Optional: Stack.Toolbar, MainHeader */}
    </>
  );
}
```

For lists, use `FlatList` with `contentInsetAdjustmentBehavior="automatic"` and `contentContainerClassName="android:pb-safe"`.

## Android UI Fallbacks

| iOS feature | Android approach |
|-------------|------------------|
| Liquid Glass / `expo-glass-effect` | `TouchableGlass` blur fallback, solid `bg-secondary` cards |
| SF Symbols | Lucide icons |
| `Link.Menu` context menus | `Alert.alert` actions or overflow menu (Material pattern) |
| Haptics | `expo-haptics` — use sparingly; optional toggle in settings |
| Transparent headers | Solid `headerStyle` with `--app-background` |

## Code Conventions

- **Filenames**: kebab-case (`settings-row.tsx`)
- **Imports**: path aliases (`@/components/...`), not deep relatives
- **Routes**: file-based in `src/app/`; dynamic routes like `item/[id].tsx`
- **Typed routes**: enabled in `app.json` experiments — use typed `Href` where possible
- **React Compiler**: enabled — avoid manual memoization unless profiling shows need
- **Selectable text**: add `selectable` on user-facing data (emails, IDs, errors)

## Common Tasks

### Add a new screen

1. Create `src/app/my-screen.tsx`
2. Register in stack if options needed (`src/app/_layout.tsx`)
3. Add drawer link in `DrawerContent` if top-level
4. Use semantic tokens; match existing spacing (px-5 sections, py-3.5 rows)

### Add a component

1. Place in `src/components/`
2. Style with `className`; export from one file
3. Wrap third-party components in `tw.tsx` if reused widely

### Theme changes

Edit OKLCH tokens in `src/global.css` `@variant light` / `@variant dark`. Map via `@theme` block. Keep variable sets identical across variants.

## Do Not

- Build iOS/web-specific UI unless asked
- Use `Platform.select` when `android:` Uniwind prefix works
- Co-locate components inside `src/app/`
- Use deprecated RN modules (legacy SafeAreaView, AsyncStorage from RN core)
- Use `expo-av` — prefer `expo-audio` / `expo-video`
- Construct dynamic Tailwind classes (`bg-${color}-500`)

## References

- Web layout & Radix: [../expo-web-app/SKILL.md](../expo-web-app/SKILL.md)
- Route conventions: [../building-native-ui/references/route-structure.md](../building-native-ui/references/route-structure.md)
- Animations: [../building-native-ui/references/animations.md](../building-native-ui/references/animations.md)
- Storage: [../building-native-ui/references/storage.md](../building-native-ui/references/storage.md)
- Material patterns: [material-patterns.md](material-patterns.md)
