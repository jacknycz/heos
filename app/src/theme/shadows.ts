import { Platform, type ViewStyle } from "react-native";
import { primary } from "./palette";
import { hexToRgba } from "./color";

type ShadowSpec = {
  color: string;
  offset: { width: number; height: number };
  opacity: number;
  radius: number;
  elevation: number;
};

// Web doesn't read the iOS shadow* props or elevation, so it gets the equivalent CSS boxShadow
// built from the same values. Native keeps the shadow* props and elevation.
function toStyle(spec: ShadowSpec): ViewStyle {
  if (Platform.OS === "web") {
    const { width, height } = spec.offset;
    return { boxShadow: `${width}px ${height}px ${spec.radius}px ${hexToRgba(spec.color, spec.opacity)}` } as ViewStyle;
  }
  return {
    shadowColor: spec.color,
    shadowOffset: spec.offset,
    shadowOpacity: spec.opacity,
    shadowRadius: spec.radius,
    elevation: spec.elevation,
  };
}

// Shared elevation tokens. Use these instead of hand-writing shadow props so every surface lifts
// the same way.
export const shadows = {
  // Small lift for cards sitting on a flat background.
  subtle: toStyle({ color: "#000000", offset: { width: 0, height: 1 }, opacity: 0.08, radius: 3, elevation: 2 }),
  // Clear separation for panels and sheets.
  raised: toStyle({ color: "#000000", offset: { width: 0, height: 4 }, opacity: 0.12, radius: 12, elevation: 6 }),
  // Strongest lift, for things that should sit over everything else.
  floating: toStyle({ color: "#000000", offset: { width: 0, height: 8 }, opacity: 0.16, radius: 20, elevation: 12 }),
  // Brand-tinted glow for primary calls to action.
  glow: toStyle({ color: primary[900], offset: { width: 0, height: 4 }, opacity: 0.5, radius: 10, elevation: 8 }),
  // Upward shadow for a bottom tab bar, so it reads as sitting above the content.
  tabBar: toStyle({ color: "#000000", offset: { width: 0, height: -2 }, opacity: 0.08, radius: 8, elevation: 8 }),
};
