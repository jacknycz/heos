import { ScrollView, StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import clsx from "clsx";
import { neutral, primary } from "../theme/palette";

type ScreenProps = ViewProps & {
  scroll?: boolean;
  edges?: Edge[];
  /** Set false when the content manages its own padding (e.g. a full-bleed FlatList). */
  padded?: boolean;
  /** "grey" is the default content area; "white" is for screens that want to read as a plain page (e.g. the Dashboard intro). */
  background?: "grey" | "white";
  /** Fades from primary at the top to the interior grey, sitting behind the content. Light mode
   * only: starts darker (primary-700) and fades out further down (50%) than dark mode does. */
  topGradient?: boolean;
};

const BACKGROUND_CLASSES = {
  grey: "bg-neutral-100 dark:bg-neutral-950",
  white: "bg-white dark:bg-neutral-950",
};

// Consistent screen padding + safe-area handling, so screens don't each reinvent it.
// Pass edges={["bottom"]} (or similar) on screens already inside a native-stack header —
// it handles the top inset, so the default ["top","bottom"] would double it up.
export function Screen({
  scroll,
  edges = ["top", "bottom"],
  padded = true,
  background = "grey",
  topGradient = false,
  className,
  children,
  ...props
}: ScreenProps) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const fadeTo = dark ? neutral[950] : neutral[100];
  const gradientFrom = dark ? primary[500] : primary[700];
  const gradientFadeLocation = dark ? 0.3 : 0.5;

  return (
    <SafeAreaView edges={edges} className={clsx("flex-1", BACKGROUND_CLASSES[background])}>
      {topGradient ? (
        <LinearGradient colors={[gradientFrom, fadeTo, fadeTo]} locations={[0, gradientFadeLocation, 1]} style={StyleSheet.absoluteFill} />
      ) : null}
      {scroll ? (
        <ScrollView className="flex-1" contentContainerClassName={clsx(padded && "gap-6 p-4", className)} {...(props as object)}>
          {children}
        </ScrollView>
      ) : (
        <View className={clsx("flex-1", padded && "gap-6 p-4", className)} {...props}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
