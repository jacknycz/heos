import { useColorScheme } from "nativewind";
import { neutral } from "../theme/palette";

// Native-stack headers take style values rather than classNames, so they read the resolved
// color scheme here. Used by every stack so the header looks the same across the app.
export function useHeaderTheme() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  return {
    background: dark ? neutral[900] : "#ffffff",
    text: dark ? neutral[50] : neutral[900],
  };
}
