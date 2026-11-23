import { useContext } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { HeaderHeightContext } from "@react-navigation/elements";
import { SafeAreaView as StackScreenSafeAreaView } from "react-native-screens/experimental";
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

const IOS_MAJOR_VERSION = Platform.OS === "ios" ? parseInt(String(Platform.Version), 10) : 0;

const styles = StyleSheet.create({ fill: { flex: 1 } });

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
  // Read from the context directly (not useHeaderHeight, which throws outside a navigator that
  // provides it) since Screen is also used on headerless screens like Login.
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const dark = colorScheme === "dark";
  const fadeTo = dark ? neutral[950] : neutral[100];
  const gradientFrom = dark ? primary[500] : primary[700];
  const gradientFadeLocation = dark ? 0.3 : 0.5;

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={clsx(padded && "gap-6 p-4", className)}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      {...(props as object)}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={clsx("flex-1", padded && "gap-6 p-4", className)} {...props}>
      {children}
    </View>
  );

  // Screens behind a native-stack header leave "top" out of `edges` (see above). But on iOS 26+,
  // react-native-screens lays every stack screen out *underneath* the navigation bar, even an
  // opaque one, and expects the navigator to inset the content. React Navigation 7 does that;
  // the v6 native-stack this app uses predates it, so without this the top of every such screen
  // (Quick Actions, a form's first field) rendered hidden under the header. This applies the same
  // inset React Navigation 7 does: react-native-screens' SafeAreaView reads the stack screen's own
  // insets, which include the bar. (react-native-safe-area-context's SafeAreaView above reads the
  // app-root provider, which only knows about the status bar.) On iOS < 26 the screen starts below
  // the bar, so the inset is 0 there and this is a no-op.
  const insetBelowHeader = Platform.OS === "ios" && !edges.includes("top");

  const content = (
    <SafeAreaView edges={edges} className={clsx("flex-1", BACKGROUND_CLASSES[background])}>
      {topGradient ? (
        <LinearGradient colors={[gradientFrom, fadeTo, fadeTo]} locations={[0, gradientFadeLocation, 1]} style={StyleSheet.absoluteFill} />
      ) : null}
      {insetBelowHeader ? <StackScreenSafeAreaView edges={{ top: true }}>{body}</StackScreenSafeAreaView> : body}
    </SafeAreaView>
  );

  // Keeps the focused input above the keyboard. On iOS a scrolling screen already handles that
  // (automaticallyAdjustKeyboardInsets on the ScrollView above). It insets the content and scrolls
  // the focused field into view, so wrapping it in KeyboardAvoidingView as well would double the gap.
  if (scroll && Platform.OS === "ios") return content;
  // KeyboardAvoidingView measures its overlap with the keyboard from its layout *relative to its
  // parent*, so it has to be told where the screen starts in the window. Below a native-stack
  // header that's the header height, except on iOS 26+, where stack screens start at the top
  // of the window, under the bar (see insetBelowHeader above).
  const keyboardOffset = Platform.OS === "ios" && IOS_MAJOR_VERSION >= 26 ? 0 : headerHeight;
  return (
    <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={keyboardOffset} style={styles.fill}>
      {content}
    </KeyboardAvoidingView>
  );
}
