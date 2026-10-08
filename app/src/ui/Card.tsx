import { View, type ViewProps } from "react-native";
import clsx from "clsx";
import { shadows } from "../theme/shadows";

// Each variant owns its border and background, so callers never override them with a second
// border or bg class. Pick a variant; add layout classes (flex, gap) through className.
const VARIANTS = {
  default: "bg-white dark:bg-neutral-900",
  danger: "border border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900",
};

type CardProps = ViewProps & { variant?: keyof typeof VARIANTS };

// Every card lifts off the page with the same subtle shadow.
export function Card({ variant = "default", className, style, ...props }: CardProps) {
  return (
    <View
      className={clsx("rounded-card p-4", VARIANTS[variant], className)}
      style={[shadows.subtle, style]}
      {...props}
    />
  );
}
