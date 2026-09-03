import { ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import clsx from "clsx";

type ScreenProps = ViewProps & {
  scroll?: boolean;
  edges?: Edge[];
  /** Set false when the content manages its own padding (e.g. a full-bleed FlatList). */
  padded?: boolean;
};

// Consistent screen padding + safe-area handling, so screens don't each reinvent it.
// Pass edges={["bottom"]} (or similar) on screens already inside a native-stack header —
// it handles the top inset, so the default ["top","bottom"] would double it up.
export function Screen({ scroll, edges = ["top", "bottom"], padded = true, className, children, ...props }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-neutral-50">
      {scroll ? (
        <ScrollView className="flex-1" contentContainerClassName={clsx(padded && "gap-4 p-4", className)} {...(props as object)}>
          {children}
        </ScrollView>
      ) : (
        <View className={clsx("flex-1", padded && "gap-4 p-4", className)} {...props}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
