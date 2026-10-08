import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { Button, type ButtonVariant } from "./Button";
import { Text } from "./Text";
import { neutral } from "../theme/palette";
import { hexToRgba } from "../theme/color";

// Matches Screen's bg-neutral-50/dark:bg-neutral-950 — derived from the same palette values
// instead of a hand-copied rgb triplet, since a gradient's colors are a style prop, not a
// className NativeWind can theme for us.
const FADE_COLORS: Record<"light" | "dark", [string, string]> = {
  light: [hexToRgba(neutral[50], 0), hexToRgba(neutral[50], 1)],
  dark: [hexToRgba(neutral[950], 0), hexToRgba(neutral[950], 1)],
};

export type QuickAction = { title: string; onPress: () => void; variant?: ButtonVariant };

// A one-line, horizontally-scrolling action bar with a fade on the trailing edge hinting
// there's more to scroll to — for screens with more quick actions than comfortably fit on
// one line at any width, instead of wrapping onto a second row.
export function QuickActions({ label = "Quick Actions", actions }: { label?: string; actions: QuickAction[] }) {
  const { colorScheme } = useColorScheme();
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <View className="relative">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2 pr-8">
          {actions.map((action) => (
            <Button key={action.title} size="sm" variant={action.variant} title={action.title} onPress={action.onPress} />
          ))}
        </ScrollView>
        {/* expo-linear-gradient isn't a NativeWind-interop'd component, so this is positioned
            with plain style rather than className — see FADE_COLORS above for the dark-mode side. */}
        <LinearGradient
          colors={FADE_COLORS[colorScheme ?? "light"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 32, pointerEvents: "none" }}
        />
      </View>
    </View>
  );
}
