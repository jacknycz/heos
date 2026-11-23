import { HeaderBackButton } from "@react-navigation/elements";
import type { HeaderBackButtonProps } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { primary } from "../theme/palette";

// The standard back button for every stack's default (non-custom) headerLeft, wired via each
// stack's screenOptions rather than per-screen. Built on React Navigation's own HeaderBackButton
// rather than a plain Pressable — a bare Pressable placed directly in a native-stack header can
// silently lose touches on iOS under the New Architecture (react-native#43546,
// react-native-screens#2219, both still open upstream); HeaderBackButton goes through
// PlatformPressable and defers onPress via requestAnimationFrame, which reporters confirm avoids
// it. Screens with their own back-navigation rules (e.g. MachinePassport's reset-vs-goBack
// choice) set their own headerLeft per-screen, which overrides this — see MachinesStack.
export function DefaultBackButton({ onPress, canGoBack }: HeaderBackButtonProps) {
  if (!canGoBack) return null;
  return (
    <HeaderBackButton onPress={onPress} labelVisible={false} backImage={() => <Ionicons name="chevron-back" size={22} color={primary[600]} />} />
  );
}
