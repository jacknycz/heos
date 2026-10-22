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
// the same way. Tinted with the darkest primary shade instead of flat black — a soft, warm-green
// cast instead of a neutral-grey one, so shadows read as part of this palette rather than a
// generic default. Kept subtle (low opacity, wide soft radius) for a tactile, not heavy, lift.
export const shadows = {
  // Small lift for cards sitting on a flat background.
  subtle: toStyle({ color: primary[950], offset: { width: 0, height: 2 }, opacity: 0.1, radius: 6, elevation: 2 }),
  // Clear separation for panels and sheets.
  raised: toStyle({ color: primary[950], offset: { width: 0, height: 6 }, opacity: 0.14, radius: 16, elevation: 6 }),
  // Strongest lift, for things that should sit over everything else.
  floating: toStyle({ color: primary[950], offset: { width: 0, height: 10 }, opacity: 0.18, radius: 24, elevation: 12 }),
  // Brand-tinted glow for primary calls to action.
  glow: toStyle({ color: primary[900], offset: { width: 0, height: 4 }, opacity: 0.5, radius: 10, elevation: 8 }),
  // Upward shadow for a bottom tab bar, so it reads as sitting above the content.
  tabBar: toStyle({ color: primary[950], offset: { width: 0, height: -2 }, opacity: 0.1, radius: 10, elevation: 8 }),
};
