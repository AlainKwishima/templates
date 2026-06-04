import { useDrawer } from "@/components/drawer-content";
import { Icon } from "@/components/icon";
import { Image } from "@/components/tw";
import { formatTimeAgo, type Item, MOCK_ITEMS } from "@/utils/mock-items";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Color, Link, Stack, useRouter } from "expo-router";
import { ChevronRight, Menu, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";

type Filter = "all" | "starred";

function ItemRow({
  item,
  onRename,
  onDelete,
  onStar,
}: {
  item: Item;
  onRename: () => void;
  onDelete: () => void;
  onStar: () => void;
}) {
  return (
    <Link href={`/item/${item.id}`} asChild>
      <Link.Trigger>
        <Pressable className="flex-row items-center px-5 py-4 active:bg-card">
          <View className="flex-1 gap-0.5 mr-3">
            <Text numberOfLines={1} className="text-[17px] text-foreground">
              {item.title}
            </Text>
            <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
              {item.subtitle} · {formatTimeAgo(item.daysAgo)}
            </Text>
          </View>
          {process.env.EXPO_OS === "ios" ? (
            <Image
              source="sf:chevron.right"
              className="w-2.5 h-4 font-medium text-muted-foreground"
            />
          ) : (
            <Icon
              icon={ChevronRight}
              className="w-2.5 h-4 text-muted-foreground"
            />
          )}
        </Pressable>
      </Link.Trigger>

      <Link.Menu>
        <Link.MenuAction
          title={item.starred ? "Unstar" : "Star"}
          icon={item.starred ? "star.fill" : "star"}
          onPress={onStar}
        />
        <Link.MenuAction title="Rename" icon="pencil" onPress={onRename} />
        <Link.MenuAction
          title="Delete"
          icon="trash"
          destructive
          onPress={onDelete}
        />
      </Link.Menu>
    </Link>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <View className="flex-1 items-center justify-center pt-32 gap-2">
      <Icon icon={Search} className="w-10 h-10 text-muted-foreground" />
      <Text className="text-[17px] text-muted-foreground text-center px-10">
        No results found for &ldquo;{query}&rdquo;
      </Text>
    </View>
  );
}

export default function ItemsScreen() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(MOCK_ITEMS);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let results = items;
    if (filter === "starred") {
      results = results.filter((c) => c.starred);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((c) => c.title.toLowerCase().includes(q));
    }
    return results;
  }, [search, items, filter]);

  const handleRename = useCallback((item: Item) => {
    Alert.prompt(
      "Rename",
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: (newTitle?: string) => {
            if (newTitle?.trim()) {
              setItems((prev) =>
                prev.map((c) =>
                  c.id === item.id ? { ...c, title: newTitle.trim() } : c,
                ),
              );
            }
          },
        },
      ],
      "plain-text",
      item.title,
    );
  }, []);

  const handleDelete = useCallback((item: Item) => {
    Alert.alert("Delete", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setItems((prev) => prev.filter((c) => c.id !== item.id));
        },
      },
    ]);
  }, []);

  const handleStar = useCallback((item: Item) => {
    setItems((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, starred: !c.starred } : c)),
    );
  }, []);

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets
        automaticallyAdjustsScrollIndicatorInsets
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="android:pb-safe pb-0"
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onRename={() => handleRename(item)}
            onDelete={() => handleDelete(item)}
            onStar={() => handleStar(item)}
          />
        )}
        ListEmptyComponent={search ? <EmptySearch query={search} /> : null}
      />

      <Stack.SearchBar
        placeholder="Search"
        hideWhenScrolling={false}
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch("")}
      />

      <LeftToolbar />
      <RightToolbar filter={filter} setFilter={setFilter} />
      <BottomToolbar />
    </>
  );
}

function LeftToolbar() {
  const { openDrawer } = useDrawer();

  if (process.env.EXPO_OS === "android") {
    return (
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
    );
  }
  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button icon="list.bullet" onPress={openDrawer} />
    </Stack.Toolbar>
  );
}

function RightToolbar({
  filter,
  setFilter,
}: {
  filter: Filter;
  setFilter: (filter: Filter) => void;
}) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon="line.horizontal.3.decrease">
        <Stack.Toolbar.Menu inline>
          <Stack.Toolbar.MenuAction
            icon="square.grid.2x2"
            isOn={filter === "all"}
            onPress={() => setFilter("all")}
          >
            All items
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="star"
            isOn={filter === "starred"}
            onPress={() => setFilter("starred")}
          >
            Starred
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}

function BottomToolbar() {
  const router = useRouter();

  return (
    <Stack.Toolbar placement="bottom">
      {isLiquidGlassAvailable() && (
        <Stack.Toolbar.SearchBarSlot separateBackground />
      )}
      <Stack.Toolbar.Button
        tintColor={Color.ios.label}
        icon="square.and.pencil"
        onPress={() => router.navigate("/")}
        separateBackground
      />
    </Stack.Toolbar>
  );
}
