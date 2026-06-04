import { Icon } from "@/components/icon";
import { MainHeader } from "@/components/main-header";
import { formatTimeAgo, MOCK_ITEMS } from "@/utils/mock-items";
import { Link } from "expo-router";
import {
  ArrowRight,
  ChevronRight,
  List,
  Settings,
  Sparkles,
  Star,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

const starred = MOCK_ITEMS.filter((item) => item.starred);

export default function HomeScreen() {
  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="android:pb-safe pb-10"
      >
        {/* Hero */}
        <View className="px-5 pt-4 pb-6">
          <View className="w-12 h-12 rounded-2xl bg-foreground items-center justify-center mb-4 border-continuous">
            <Icon icon={Sparkles} className="w-6 h-6 text-background" />
          </View>
          <Text className="text-[28px] font-bold text-foreground">
            Welcome
          </Text>
          <Text className="text-[17px] text-muted-foreground mt-1 leading-snug">
            A universal Expo starter for iOS, Android, and web. Edit this screen
            in src/app/index.tsx.
          </Text>
        </View>

        {/* Quick links */}
        <View className="px-5 gap-3">
          <QuickLink
            href="/items"
            icon={List}
            title="Browse items"
            subtitle="List + detail example"
          />
          <QuickLink
            href="/(settings)/settings"
            icon={Settings}
            title="Settings"
            subtitle="Profile, appearance, and more"
          />
        </View>

        {/* Starred preview */}
        {starred.length > 0 && (
          <View className="mt-8">
            <View className="flex-row items-center justify-between px-5 pb-2">
              <Text className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                Starred
              </Text>
              <Link href="/items" asChild>
                <Pressable className="flex-row items-center gap-1 active:opacity-60">
                  <Text className="text-[13px] text-muted-foreground">All</Text>
                  <Icon
                    icon={ArrowRight}
                    className="w-3.5 h-3.5 text-muted-foreground"
                  />
                </Pressable>
              </Link>
            </View>
            {starred.map((item) => (
              <Link key={item.id} href={`/item/${item.id}`} asChild>
                <Pressable className="flex-row items-center px-5 py-3.5 gap-3.5 active:bg-muted">
                  <Icon icon={Star} className="w-4 h-4 text-yellow-500" />
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[17px] text-foreground"
                    >
                      {item.title}
                    </Text>
                    <Text className="text-[13px] text-muted-foreground">
                      {formatTimeAgo(item.daysAgo)}
                    </Text>
                  </View>
                  <Icon
                    icon={ChevronRight}
                    className="w-3.5 h-3.5 text-muted-foreground"
                  />
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
      <MainHeader />
    </>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable className="flex-row items-center gap-3.5 bg-secondary rounded-xl px-4 py-3.5 active:bg-muted border-continuous">
        <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
          <Icon icon={icon} className="w-5 h-5 text-foreground" />
        </View>
        <View className="flex-1">
          <Text className="text-[17px] font-medium text-foreground">
            {title}
          </Text>
          <Text className="text-[13px] text-muted-foreground">{subtitle}</Text>
        </View>
        <Icon icon={ChevronRight} className="w-4 h-4 text-muted-foreground" />
      </Pressable>
    </Link>
  );
}
