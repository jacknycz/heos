// Converts a "#rrggbb" hex string (from palette.js) into an rgba() string at the given alpha —
// for the handful of places (gradient fades) that need a transparent variant of a palette color,
// so they derive it instead of hand-copying an rgb triplet that can silently drift from the
// palette the next time it changes.
export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
