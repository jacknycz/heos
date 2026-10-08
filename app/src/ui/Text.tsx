import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import clsx from "clsx";

type Variant = "title" | "section" | "heading" | "body" | "label" | "muted";

const VARIANTS: Record<Variant, string> = {
  title: "text-2xl font-bold text-neutral-900 dark:text-neutral-50",
  section: "text-xl font-semibold text-neutral-900 dark:text-neutral-50",
  heading: "text-base font-semibold text-neutral-900 dark:text-neutral-50",
  body: "text-base text-neutral-900 dark:text-neutral-50",
  label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
  muted: "text-sm text-neutral-500 dark:text-neutral-400",
};

export type TextProps = RNTextProps & { variant?: Variant; className?: string };

// The one Text component every screen should use — keeps type scale/color consistent
// instead of each screen picking its own fontSize/color inline.
export function Text({ variant = "body", className, ...props }: TextProps) {
  return <RNText className={clsx(VARIANTS[variant], className)} {...props} />;
}
