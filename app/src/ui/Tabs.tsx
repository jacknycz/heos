import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { Text } from "./Text";
import { shadows } from "../theme/shadows";
import { neutral } from "../theme/palette";

export type TabItem = { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap };

// A segmented-control-style switcher for content that lives on one screen (as opposed to
// BottomNav, which switches between whole app sections). No swipe/pager dependency — just
// tap-to-switch. "icon" shows a large icon per tab and only reveals the label on the selected tab.
export function Tabs({
  tabs,
  activeKey,
  onChange,
  variant = "text",
}: {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: "text" | "icon";
}) {
  return (
    <View className="flex-row gap-1 rounded-card bg-white p-1 dark:bg-neutral-800" style={shadows.subtle}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={clsx("flex-1 items-center rounded-card py-2", active && "bg-primary-600")}
          >
            {variant === "icon" ? (
              <>
                {tab.icon ? <Ionicons name={tab.icon} size={26} color={active ? "#fff" : neutral[500]} /> : null}
                <Text
                  className={clsx(
                    "text-center text-xs font-semibold leading-none",
                    active ? "text-white" : "text-neutral-500 dark:text-neutral-400",
                  )}
                >
                  {tab.label}
                </Text>
              </>
            ) : (
              <Text className={clsx("text-sm font-semibold", active ? "text-white" : "text-neutral-500 dark:text-neutral-400")}>
                {tab.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
