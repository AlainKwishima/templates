# Expo Template

A universal app starter built with [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/). Ships with iOS 26 Liquid Glass support, a platform-adaptive drawer/sidebar, dark mode, and runs on iOS, Android, and web from a single codebase.

## Features

- **Platform-adaptive navigation** — native gesture-driven drawer on iOS/Android, collapsible sidebar with Radix context menus, dropdown menus, and tooltips on web
- **Liquid Glass** — glassmorphic navigation bars and toolbar buttons on iOS 26 via `expo-glass-effect`, with graceful fallbacks elsewhere
- **Dark mode** — automatic light/dark theming using OKLCH design tokens in Tailwind CSS v4
- **Native UI controls** — toolbar buttons, menus, and haptic feedback on iOS via `@expo/ui`
- **Example screens** — Home, a searchable list with context-menu actions, a typed detail route, and a full Settings flow (profile, preferences, toggles)
- **Keyboard-aware** — inputs stay above the keyboard with `react-native-keyboard-controller`

## Tech Stack

| Layer      | Technology                                                                       |
| ---------- | -------------------------------------------------------------------------------- |
| Framework  | Expo SDK 56, React Native 0.85, React 19                                          |
| Navigation | Expo Router (file-based) with typed routes                                        |
| Styling    | Tailwind CSS v4 via [Uniwind](https://uniwind.dev/) + `tailwind-merge`            |
| Native UI  | `@expo/ui` (SwiftUI), `expo-haptics`, `expo-glass-effect`                          |
| Web UI     | Radix UI (context menu, dropdown menu, tooltips), Lucide icons                     |
| Animations | `react-native-reanimated`, `react-native-gesture-handler`                          |

## Getting Started

```bash
# Install dependencies
bun install

# Start the dev server
bun start

# Run on a specific platform
bun run ios
bun run android
bun run web
```

> Requires [Bun](https://bun.sh) and the [Expo CLI](https://docs.expo.dev/get-started/installation/). This app uses a custom development build and will not run in Expo Go. For iOS, you'll need Xcode and a simulator or device. Add native dependencies with `bunx expo install`.

### Environment Variables

Copy `.env.example` to `.env` and add your own values. Anything exposed to the client must be prefixed with `EXPO_PUBLIC_`.

```bash
cp .env.example .env
```

## Project Structure

```
src/
  app/                  # Expo Router screens (file-based routes)
    _layout.tsx         # Native root layout: drawer + stack
    _layout.web.tsx     # Web root layout: sidebar + content
    index.tsx           # Home screen
    items.tsx           # Example list screen
    item/[id].tsx       # Example detail screen (typed dynamic route)
    (settings)/         # Settings stack (modal on iOS)
  components/            # Reusable UI (drawer, sidebar, header, icons, glass)
  utils/                # Helpers + mock data
  global.css            # Design tokens (OKLCH) + Tailwind theme mapping
```

## Customization

### Rename the app

Update `name`, `slug`, and `scheme` in `app.json`, and `name` in `package.json`. The display name "Acme" appears in the drawer/sidebar header and Home title — search the `src/` directory and replace it with your brand.

### Theme

Edit `src/global.css` to change the design tokens. Colors use OKLCH for perceptual uniformity across light and dark modes. The `@theme` block maps CSS variables to Tailwind classes:

```css
--app-background  ->  bg-background
--app-foreground  ->  text-foreground
--app-muted       ->  bg-muted
--app-border      ->  border-border
/* etc. */
```

### Data

The example screens read from `src/utils/mock-items.ts`. Replace it with your real data source (an API, a database, local storage…) and update the screens that import it.

For a backend, [Convex](https://convex.dev) sets up in a single command and pairs well with Expo:

```bash
npx eas-cli@latest integrations:convex:connect
```

Pair it with [better-auth](https://labs.convex.dev/better-auth/framework-guides/expo) for authentication and [Expo Notifications](https://www.convex.dev/components/push-notifications) for push.

## License

MIT.
