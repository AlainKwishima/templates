---
name: android-forms-and-input
description: Build forms, text inputs, validation, and keyboard-aware layouts on Android and web with this Expo template. Use when creating login screens, settings inputs, search fields, multi-step forms, or fixing keyboard overlap issues.
---

# Android Forms & Input

## Platform Notes

- **Android**: `KeyboardProvider` in root layout; use `android:pb-safe` on scroll content
- **Web**: No keyboard controller needed; use `keyboardShouldPersistTaps="handled"` on scroll views; tab order follows render order — group fields logically

## Keyboard Setup (Android)

Root layout wraps `KeyboardProvider` from `react-native-keyboard-controller`. Use for forms that need keyboard avoidance on native.

For scrollable forms:

```tsx
<ScrollView
  className="flex-1 bg-background"
  contentInsetAdjustmentBehavior="automatic"
  contentContainerClassName="android:pb-safe px-5 gap-4"
  keyboardShouldPersistTaps="handled"
>
  {/* fields */}
</ScrollView>
```

`keyboardShouldPersistTaps="handled"` lets users tap buttons without dismissing keyboard first.

## TextInput Styling

```tsx
<TextInput
  className="border border-border rounded-xl px-4 py-3 text-[17px] text-foreground bg-card focus:border-foreground"
  placeholderTextColorClassName="accent-muted-foreground"
  selectionColorClassName="accent-foreground"
  cursorColorClassName="accent-foreground"
  placeholder="Email"
  autoCapitalize="none"
  autoCorrect={false}
  keyboardType="email-address"
/>
```

Rules:
- Use `accent-` prefix on all `*ColorClassName` props
- Match border radius to template (`rounded-xl`)
- Labels above field: `text-[13px] font-semibold text-muted-foreground mb-1.5`

## Labels & Errors

```tsx
<View className="gap-1.5">
  <Text className="text-[13px] font-semibold text-muted-foreground">Password</Text>
  <TextInput /* ... */ />
  {error && (
    <Text selectable className="text-[13px] text-red-500">
      {error}
    </Text>
  )}
</View>
```

Prefer semantic error color token if added to theme; until then red-500 is acceptable for errors only.

## Buttons

Primary submit:

```tsx
<Pressable
  disabled={isSubmitting}
  className="bg-foreground rounded-xl py-3.5 items-center active:opacity-80 disabled:opacity-50"
>
  <Text className="text-[17px] font-semibold text-background">Sign in</Text>
</Pressable>
```

Secondary/cancel: `bg-secondary active:bg-muted`.

Minimum height ~48dp (`py-3.5` + text).

## Switch Rows

From settings pattern — label left, switch right:

```tsx
<View className="flex-row items-center px-5 py-3 gap-4">
  <Text className="flex-1 text-[17px] text-foreground">Enable notifications</Text>
  <Switch value={value} onValueChange={setValue} />
</View>
```

Optional: `thumbColorClassName` / `trackColorOnClassName` with `accent-` tokens for brand consistency.

## Validation Pattern

```tsx
const [email, setEmail] = useState("");
const [error, setError] = useState<string | null>(null);

function submit() {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) {
    setError("Enter a valid email");
    return;
  }
  setError(null);
  // proceed
}
```

Validate on submit, not every keystroke (unless live validation requested). Clear error when user edits field.

## Search

Template uses `Stack.SearchBar` on items screen. For inline search:

```tsx
<View className="flex-row items-center bg-muted rounded-xl px-3 mx-5 mb-4">
  <Icon icon={Search} className="w-5 h-5 text-muted-foreground" />
  <TextInput
    className="flex-1 py-2.5 px-2 text-[17px] text-foreground"
    placeholder="Search"
    placeholderTextColorClassName="accent-muted-foreground"
    value={query}
    onChangeText={setQuery}
    returnKeyType="search"
  />
</View>
```

## Multi-Step Forms

- One primary action per step
- Progress indicator optional (step dots or "Step 2 of 3" in `text-muted-foreground`)
- Back via stack header; don't hide system back
- Persist draft in component state or AsyncStorage/SecureStore for long flows

## Accessibility

- `accessibilityLabel` on icon-only clear buttons
- `textContentType` / `autoComplete` for passwords, email, names (Android autofill)
- `selectable` on error messages and confirmation codes

## Do Not

- Use `KeyboardAvoidingView` if `KeyboardProvider` + scroll already handles layout
- Wrap inputs in `withUniwind(TextInput)` — core RN has className built in
- Use function form of Pressable style — use `active:` classes
