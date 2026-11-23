import { Platform } from "react-native";
import { HeaderBackButton } from "@react-navigation/elements";
import type { HeaderBackButtonProps } from "@react-navigation/elements";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { primary } from "../theme/palette";

// The custom back button for Android and web, where it gives the chevron the same left padding
// as Screen's p-4 content (native-stack has no option to pad the built-in one). Uses the onPress
// React Navigation already wires up (plain goBack).
export function DefaultBackButton({ onPress, canGoBack }: HeaderBackButtonProps) {
  if (!canGoBack) return null;
  return (
    <HeaderBackButton onPress={onPress} labelVisible={false} backImage={() => <Ionicons name="chevron-back" size={22} color={primary[600]} />} />
  );
}

// Spread into every stack's screenOptions, after headerTintColor. On iOS the back button is the
// native UIKit one: on iOS 26, a custom view in the navigation bar (even React Navigation's own
// HeaderBackButton) rendered inside its Liquid Glass capsule but didn't respond to taps with this
// app's React Navigation 6 / react-native-screens 4.x pairing, while the system back button is
// plain UIKit and always works. The tint keeps its chevron primary-colored like the custom one;
// the title has its own color via headerTitleStyle, so the tint doesn't affect it.
export const backButtonOptions: NativeStackNavigationOptions =
  Platform.OS === "ios" ? { headerBackTitleVisible: false, headerTintColor: primary[600] } : { headerLeft: DefaultBackButton };
