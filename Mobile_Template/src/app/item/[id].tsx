import { Icon } from "@/components/icon";
import { formatTimeAgo, getItem } from "@/utils/mock-items";
import { Stack, useLocalSearchParams } from "expo-router";
import { Star } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = getItem(id);

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-10">
        <Stack.Screen options={{ title: "Not found" }} />
        <Text className="text-[17px] text-muted-foreground text-center">
          This item doesn&apos;t exist.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="android:pb-safe px-5 pb-10"
    >
      <Stack.Screen options={{ title: item.title }} />

      <View className="pt-4 pb-5">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.subtitle}
          </Text>
          {item.starred && (
            <Icon icon={Star} className="w-3.5 h-3.5 text-yellow-500" />
          )}
        </View>
        <Text className="text-[28px] font-bold text-foreground leading-tight">
          {item.title}
        </Text>
        <Text className="text-[13px] text-muted-foreground mt-1">
          {formatTimeAgo(item.daysAgo)}
        </Text>
      </View>

      <View className="h-px bg-border" />

      <Text className="text-[17px] text-foreground leading-relaxed mt-5">
        {item.body}
      </Text>
    </ScrollView>
  );
}
