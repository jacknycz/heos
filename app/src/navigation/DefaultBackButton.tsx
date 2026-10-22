import { Pressable } from "react-native";
import type { HeaderBackButtonProps } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { primary } from "../theme/palette";

// The standard back button for every stack's default (non-custom) headerLeft, wired via each
// stack's screenOptions rather than per-screen — React Navigation's native-stack has no
// "container style" option to pad the built-in back button, so this renders its own, with the
// same left padding as Screen's p-4 content below it. Uses the onPress React Navigation already
// wires up (plain goBack), rather than re-implementing navigation logic here — screens with their
// own back-navigation rules (e.g. MachinePassport's reset-vs-goBack choice) set their own
// headerLeft per-screen, which overrides this.
export function DefaultBackButton({ onPress, canGoBack }: HeaderBackButtonProps) {
  if (!canGoBack) return null;
  return (
    <Pressable onPress={onPress} hitSlop={8} className="py-1 pl-4 pr-2">
      <Ionicons name="chevron-back" size={22} color={primary[600]} />
    </Pressable>
  );
}
