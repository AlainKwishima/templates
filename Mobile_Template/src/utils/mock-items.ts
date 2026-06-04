export type Item = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  daysAgo: number;
  starred: boolean;
};

/**
 * Placeholder data so the list and detail screens render out of the box.
 * Swap this for your real data source (a database, an API, local storage…).
 */
export const MOCK_ITEMS: Item[] = [
  {
    id: "1",
    title: "Welcome to your new app",
    subtitle: "Start here",
    body: "This is a placeholder item. Replace `MOCK_ITEMS` with your own data and build out the detail screen however you like.",
    daysAgo: 0,
    starred: true,
  },
  {
    id: "2",
    title: "Platform-adaptive navigation",
    subtitle: "Drawer on native, sidebar on web",
    body: "The template ships with a gesture-driven drawer on iOS and Android and a collapsible sidebar on web — all from a single codebase.",
    daysAgo: 1,
    starred: false,
  },
  {
    id: "3",
    title: "Liquid Glass ready",
    subtitle: "iOS 26",
    body: "Navigation bars and toolbar buttons use Liquid Glass on iOS 26 via expo-glass-effect, with graceful fallbacks elsewhere.",
    daysAgo: 2,
    starred: false,
  },
  {
    id: "4",
    title: "Dark mode out of the box",
    subtitle: "OKLCH design tokens",
    body: "Colors are defined as OKLCH tokens in global.css and mapped to Tailwind classes, so light and dark themes stay perceptually consistent.",
    daysAgo: 3,
    starred: true,
  },
  {
    id: "5",
    title: "Tailwind styling with Uniwind",
    subtitle: "className everywhere",
    body: "Style React Native components with Tailwind classes via Uniwind. Use the active: modifier for pressed states.",
    daysAgo: 5,
    starred: false,
  },
  {
    id: "6",
    title: "Typed file-based routing",
    subtitle: "Expo Router",
    body: "Screens are files. This item opens a typed dynamic route at /item/[id].",
    daysAgo: 7,
    starred: false,
  },
  {
    id: "7",
    title: "Native UI controls",
    subtitle: "@expo/ui, haptics",
    body: "Reach for SwiftUI menus, toolbars, and haptic feedback when you want the experience to feel truly native.",
    daysAgo: 9,
    starred: false,
  },
  {
    id: "8",
    title: "Make it yours",
    subtitle: "Delete this list",
    body: "Once you've explored the patterns, delete mock-items.ts and the example screens and build your real app.",
    daysAgo: 14,
    starred: false,
  },
];

export function getItem(id: string): Item | undefined {
  return MOCK_ITEMS.find((item) => item.id === id);
}

export function formatTimeAgo(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo < 7) return `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
  const weeks = Math.round(daysAgo / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}
