import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import clsx from "clsx";

type Variant = "title" | "heading" | "body" | "label" | "muted";

const VARIANTS: Record<Variant, string> = {
  title: "text-2xl font-bold text-neutral-900",
  heading: "text-base font-semibold text-neutral-900",
  body: "text-base text-neutral-900",
  label: "text-sm font-medium text-neutral-700",
  muted: "text-sm text-neutral-500",
};

export type TextProps = RNTextProps & { variant?: Variant; className?: string };

// The one Text component every screen should use — keeps type scale/color consistent
// instead of each screen picking its own fontSize/color inline.
export function Text({ variant = "body", className, ...props }: TextProps) {
  return <RNText className={clsx(VARIANTS[variant], className)} {...props} />;
}
