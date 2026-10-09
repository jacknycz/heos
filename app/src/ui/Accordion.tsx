import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import clsx from "clsx";
import { Text } from "./Text";
import { danger, neutral, warning, white } from "../theme/palette";

export type AccordionTone = "primary" | "neutral" | "success" | "warning" | "danger";

const TONES: Record<AccordionTone, { border: string; bg: string; text: string }> = {
  primary: {
    border: "border-primary-200 dark:border-primary-800",
    bg: "bg-primary-50 dark:bg-primary-950",
    text: "text-primary-700 dark:text-primary-300",
  },
  neutral: {
    border: "border-neutral-200 dark:border-neutral-800",
    bg: "bg-neutral-50 dark:bg-neutral-900",
    text: "text-neutral-800 dark:text-neutral-100",
  },
  success: {
    border: "border-success-200 dark:border-success-800",
    bg: "bg-success-50 dark:bg-success-950",
    text: "text-success-700 dark:text-success-300",
  },
  warning: {
    border: "border-warning-200 dark:border-warning-800",
    bg: "bg-warning-50 dark:bg-warning-900",
    text: "text-warning-800 dark:text-warning-200",
  },
  danger: {
    border: "border-danger-200 dark:border-danger-800",
    bg: "bg-danger-50 dark:bg-danger-900",
    text: "text-danger-700 dark:text-danger-300",
  },
};

// The saturated shade used for a solid collapsed header, its border, and icons once expanded.
// Only tones with an entry here can use `solid`.
const SOLID_COLORS: Partial<Record<AccordionTone, string>> = {
  danger: danger[600],
  warning: warning[600],
};

const TRANSITION_MS = 220;

// Solid mode animates through plain Animated components with style objects, not NativeWind
// className, so the animated values reach the native/web style layer directly. Values mirror the
// kit's tokens: rounded-card = 12, p-4 = 16, gap-2 = 8, text-base = 16 / font-semibold.
const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 16 },
  body: { paddingTop: 8, gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "600" },
});

// A collapsible section with a tone-colored header and a rotating chevron. With `solid`, the
// collapsed header fills with the tone's 600 shade (white title and icons, 600 border) and the
// expanded body turns white (tone-colored icons, default body text).
//
// Motion: the body's height and opacity are driven directly from one progress value, using the
// content's measured height. The header is never re-laid-out, so the title can't flicker. The
// chevron rotates off the same value.
export function Accordion({
  title,
  tone = "neutral",
  defaultExpanded = true,
  solid = false,
  icon,
  children,
}: {
  title: string;
  tone?: AccordionTone;
  defaultExpanded?: boolean;
  solid?: boolean;
  /** Optional leading Ionicons glyph, shown to the left of the title. */
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const progress = useSharedValue(defaultExpanded ? 1 : 0);
  const contentHeight = useSharedValue(0);
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const { border, bg, text } = TONES[tone];

  const solidColor = solid ? SOLID_COLORS[tone] : undefined;
  const expandedSurface = dark ? neutral[900] : white;
  const expandedTitle = dark ? neutral[50] : neutral[900];

  const cardStyle = useAnimatedStyle(() =>
    solidColor
      ? {
          backgroundColor: interpolateColor(progress.value, [0, 1], [solidColor, expandedSurface]),
          borderColor: solidColor,
        }
      : {},
  );
  const titleStyle = useAnimatedStyle(() =>
    solidColor ? { color: interpolateColor(progress.value, [0, 1], [white, expandedTitle]) } : {},
  );
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }));
  const bodyStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, contentHeight.value]),
    opacity: progress.value,
  }));

  const iconColor = solid ? (expanded ? solidColor : white) : neutral[400];

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    progress.value = withTiming(next ? 1 : 0, { duration: TRANSITION_MS });
  }

  const header = (
    <Pressable onPress={toggle} className="flex-row items-center justify-between gap-2" accessibilityRole="button" accessibilityState={{ expanded }}>
      <View className="flex-1 flex-row items-center gap-2">
        {icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null}
        {solidColor ? (
          <Animated.Text style={[styles.title, titleStyle]}>{title}</Animated.Text>
        ) : (
          <Text variant="heading" className={clsx("flex-1", text)}>
            {title}
          </Text>
        )}
      </View>
      <Animated.View style={chevronStyle}>
        <Ionicons name="chevron-down" size={20} color={iconColor} />
      </Animated.View>
    </Pressable>
  );

  // The body is always mounted so its height can animate from 0 to the measured content height;
  // overflow is clipped by the Animated wrapper's height.
  const body = (
    <Animated.View style={[{ overflow: "hidden" }, bodyStyle]}>
      <View style={styles.body} onLayout={(e) => (contentHeight.value = e.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );

  if (solidColor) {
    return (
      <Animated.View style={[styles.card, cardStyle]}>
        {header}
        {body}
      </Animated.View>
    );
  }

  return (
    <View className={clsx("rounded-card border p-4", border, bg)}>
      {header}
      {body}
    </View>
  );
}
