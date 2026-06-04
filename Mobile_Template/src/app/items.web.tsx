import { Icon } from "@/components/icon";
import { formatTimeAgo, type Item, MOCK_ITEMS } from "@/utils/mock-items";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "expo-router";
import {
  ChevronRight,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Filter = "all" | "starred";

const MENU_CONTENT_CLASS =
  "z-[100] min-w-[180px] rounded-xl bg-card p-1.5 shadow-float border border-border/40 animate-fade-up";

const MENU_ITEM_CLASS =
  "flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground outline-none data-[highlighted]:bg-accent";

const MENU_DESTRUCTIVE_CLASS =
  "flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-red-500 outline-none data-[highlighted]:bg-red-500/10";

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
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <Link href={`/item/${item.id}`} asChild>
          <Pressable className="flex-row items-center px-5 py-4 active:bg-card hover:bg-card/80">
            <View className="flex-1 gap-0.5 mr-3">
              <Text numberOfLines={1} className="text-[17px] text-foreground">
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                className="text-[13px] text-muted-foreground"
              >
                {item.subtitle} · {formatTimeAgo(item.daysAgo)}
              </Text>
            </View>
            <Icon
              icon={ChevronRight}
              className="w-2.5 h-4 text-muted-foreground"
            />
          </Pressable>
        </Link>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={MENU_CONTENT_CLASS}>
          <ContextMenu.Item
            className={MENU_ITEM_CLASS}
            onSelect={onStar}
          >
            {item.starred ? "Unstar" : "Star"}
          </ContextMenu.Item>
          <ContextMenu.Item className={MENU_ITEM_CLASS} onSelect={onRename}>
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item
            className={MENU_DESTRUCTIVE_CLASS}
            onSelect={onDelete}
          >
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
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

function ListHeader({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: {
  search: string;
  onSearchChange: (text: string) => void;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}) {
  return (
    <View className="pb-2">
      <View className="flex-row items-center bg-muted rounded-xl px-3 mx-5 mt-4 mb-3">
        <Icon icon={Search} className="w-5 h-5 text-muted-foreground" />
        <TextInput
          className="flex-1 py-2.5 px-2 text-[17px] text-foreground outline-none"
          placeholder="Search"
          placeholderTextColor="#999"
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
      </View>
      <View className="flex-row items-center justify-end px-5">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Pressable className="flex-row items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent active:bg-muted">
              <Icon
                icon={SlidersHorizontal}
                className="w-4 h-4 text-muted-foreground"
              />
              <Text className="text-[13px] text-muted-foreground">
                {filter === "all" ? "All items" : "Starred"}
              </Text>
            </Pressable>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={MENU_CONTENT_CLASS}
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                className={MENU_ITEM_CLASS}
                onSelect={() => onFilterChange("all")}
              >
                All items
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={MENU_ITEM_CLASS}
                onSelect={() => onFilterChange("starred")}
              >
                <Icon icon={Star} className="w-4 h-4 text-muted-foreground" />
                Starred
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </View>
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
    const newTitle = window.prompt("Rename", item.title);
    if (newTitle?.trim()) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, title: newTitle.trim() } : c,
        ),
      );
    }
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
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerClassName="pb-8"
      ListHeaderComponent={
        <ListHeader
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />
      }
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
  );
}
