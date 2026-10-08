import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme, useColorScheme } from "nativewind";

export type AppColorScheme = "light" | "dark";

const THEME_KEY = "heos.themePreference";

// Applies the user's last explicit choice, if any — call once at app startup. With nothing
// stored yet (first launch, or the toggle's never been touched), NativeWind's own default
// takes over on its own: it follows the OS setting, falling back to light if that's
// unavailable, so there's nothing to apply in that case.
export async function applyStoredColorScheme() {
  const stored = await AsyncStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    colorScheme.set(stored);
  }
}

// Same as nativewind's own useColorScheme, except the setter also persists the choice —
// nativewind's colorScheme.set is in-memory only and forgets it on reload.
export function usePersistedColorScheme() {
  const { colorScheme: scheme, setColorScheme } = useColorScheme();

  function set(value: AppColorScheme) {
    setColorScheme(value);
    AsyncStorage.setItem(THEME_KEY, value);
  }

  return { colorScheme: (scheme ?? "light") as AppColorScheme, setColorScheme: set };
}
