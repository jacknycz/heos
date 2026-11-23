import { PlatformPressable } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { primary } from "../theme/palette";

// For headerRight icon buttons (e.g. the "+" on Fleet/Locations) — same reasoning as
// DefaultBackButton: a plain Pressable placed directly in a native-stack header can silently
// lose touches on iOS under the New Architecture, so this uses React Navigation's own
// PlatformPressable (what HeaderBackButton itself is built on) and defers onPress via
// requestAnimationFrame to match.
export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <PlatformPressable
      onPress={() => requestAnimationFrame(onPress)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
    >
      <Ionicons name={icon} size={26} color={primary[600]} />
    </PlatformPressable>
  );
}
