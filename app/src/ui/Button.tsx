import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import clsx from "clsx";
import { Text } from "./Text";
import { primary, white } from "../theme/palette";
import { shadows } from "../theme/shadows";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "fancy" | "industrial";
type Size = "md" | "sm";

const CONTAINER_BASE = "flex-row items-center justify-center rounded-card active:opacity-80";
const CONTAINER_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary-600",
  secondary: "bg-neutral-200 dark:bg-neutral-800",
  outline: "bg-transparent border border-neutral-300 dark:border-neutral-700",
  danger: "bg-danger-600",
  ghost: "bg-transparent",
  // A dressed-up primary — a soft white rim + a colored ambient shadow — for a button sitting
  // on a busy/colored hero background where a flat bg-primary-600 wouldn't stand out on its own
  // (e.g. LoginScreen's gradient).
  fancy: "bg-primary-600 border border-white/30",
  // A physical push button: a thick darker bottom edge that sinks flat when pressed. Used sparingly
  // for equipment-style actions.
  industrial: "bg-primary-600 border-2 border-b-8 border-primary-800 active:mt-1 active:border-b-4",
};
const CONTAINER_SIZES: Record<Size, string> = {
  md: "px-4 py-3",
  sm: "px-3 py-2",
};
const TEXT_VARIANTS: Record<ButtonVariant, string> = {
  primary: "text-white font-semibold",
  secondary: "text-neutral-900 dark:text-neutral-50 font-semibold",
  outline: "text-neutral-900 dark:text-neutral-50 font-semibold",
  danger: "text-white font-semibold",
  ghost: "text-primary-600 dark:text-primary-400 font-semibold",
  fancy: "text-white font-semibold",
  industrial: "text-white font-bold uppercase tracking-wider",
};
const TEXT_SIZES: Record<Size, string> = {
  md: "text-base",
  sm: "text-sm",
};

// Variants whose label and spinner sit on a filled, dark background (so white reads best).
const FILLED_VARIANTS: ButtonVariant[] = ["primary", "danger", "fancy", "industrial"];

export type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
  className?: string;
  /** Overrides the label's default per-variant color — e.g. a ghost button on a colored (non-surface) background. */
  textClassName?: string;
};

export function Button({ title, variant = "primary", size = "md", loading, disabled, className, textClassName, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  const filled = FILLED_VARIANTS.includes(variant);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={clsx(CONTAINER_BASE, CONTAINER_VARIANTS[variant], CONTAINER_SIZES[size], isDisabled && "opacity-50", className)}
      style={(state) => [
        variant === "fancy" && shadows.glow,
        variant === "industrial" && shadows.raised,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={filled ? white : primary[600]} />
      ) : (
        <Text className={clsx(TEXT_VARIANTS[variant], TEXT_SIZES[size], textClassName)}>{title}</Text>
      )}
    </Pressable>
  );
}
