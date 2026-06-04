# Android Material Patterns (Template Mapping)

Use these when building screens in this Expo template. Align with Material Design 3 mentally, but implement with Uniwind tokens — not Material Components library unless explicitly requested.

## Navigation

| Pattern | Template implementation |
|---------|-------------------------|
| Navigation drawer | `DrawerLayout` + swipe from left edge |
| Top app bar | Expo Router `Stack` header + `Stack.Toolbar` |
| Back | Stack back button; settings as nested stack |
| Bottom bar | Not in template — add `Tabs` or custom bar if needed |

## Lists

- Full-width rows: `px-5 py-3.5` or `py-4`
- Divider between groups: `h-px bg-border mx-5`
- Chevron trailing: Lucide `ChevronRight`, muted color
- Press state: `active:bg-muted` on `Pressable`
- Minimum touch height: ~48dp (`py-3.5` + text ≈ 48px)

## Cards & Surfaces

- Grouped content: `bg-muted rounded-xl px-4 py-3`
- Elevated card: `bg-secondary rounded-xl` + `shadow-card` token
- Page background: `bg-background`
- Avoid heavy elevation stacks — prefer flat Material 3 surfaces

## Settings Screen Pattern

From `src/app/(settings)/settings.tsx`:

```
[ info banner — bg-muted rounded-xl ]
[ icon + label + optional detail + chevron rows ]
[ divider ]
[ icon + label + Switch rows ]
[ destructive action row ]
```

Section spacing: divider with `mx-5`, rows `px-5 py-3.5 gap-4`.

## Dialogs & Actions

- Confirm/delete: `Alert.alert` with `destructive` style
- Text input: `Alert.prompt` (Android support varies — test on device)
- Long-press menus: prefer overflow `Icon` button → action sheet pattern over iOS `Link.Menu`

## Empty & Error States

Center content vertically with icon + message:

```tsx
<View className="flex-1 items-center justify-center pt-32 gap-2">
  <Icon icon={Search} className="w-10 h-10 text-muted-foreground" />
  <Text className="text-[17px] text-muted-foreground text-center px-10">
    No results found
  </Text>
</View>
```

## Motion

- Drawer: spring animation in `DrawerLayout` (already configured)
- Screen transitions: stack defaults; avoid `animation: "none"` unless anchor screen
- Press feedback: `active:opacity-60` or `active:bg-muted` — keep under 200ms feel
- Prefer Reanimated for complex motion; read animations reference for entering/exiting

## Accessibility

- `accessibilityLabel` + `accessibilityRole="button"` on icon-only controls
- `numberOfLines={1}` on list titles to prevent layout break
- `selectable` on copyable content
- Respect system font scale — avoid fixed heights that clip scaled text
