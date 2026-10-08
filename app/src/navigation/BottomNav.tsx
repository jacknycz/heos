import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { Text } from "../ui/Text";
import { shadows } from "../theme/shadows";
import { primary, neutral } from "../theme/palette";

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Dashboard: { active: "grid", inactive: "grid-outline" },
  Machines: { active: "construct", inactive: "construct-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
};

// Custom bottom tab bar (icon + label, docked) so the nav matches the rest of the
// component kit instead of React Navigation's unstyled default.
export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      style={[{ paddingBottom: insets.bottom }, shadows.tabBar]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const icon = ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            className="flex-1 items-center justify-center gap-1 py-2"
          >
            {icon && (
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={focused ? primary[600] : neutral[500]}
              />
            )}
            <Text
              variant="label"
              className={clsx("text-xs", focused ? "font-semibold text-primary-600" : "font-normal text-neutral-500")}
            >
              {options.title ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
