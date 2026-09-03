import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import clsx from "clsx";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "md" | "sm";

const CONTAINER_BASE = "flex-row items-center justify-center rounded-card active:opacity-80";
const CONTAINER_VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-600",
  secondary: "bg-neutral-100",
  outline: "bg-transparent border border-neutral-300",
  danger: "bg-danger-600",
  ghost: "bg-transparent",
};
const CONTAINER_SIZES: Record<Size, string> = {
  md: "px-4 py-3",
  sm: "px-3 py-2",
};
const TEXT_VARIANTS: Record<Variant, string> = {
  primary: "text-white font-semibold",
  secondary: "text-neutral-900 font-semibold",
  outline: "text-neutral-900 font-semibold",
  danger: "text-white font-semibold",
  ghost: "text-primary-600 font-semibold",
};
const TEXT_SIZES: Record<Size, string> = {
  md: "text-base",
  sm: "text-sm",
};

export type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
};

export function Button({ title, variant = "primary", size = "md", loading, disabled, className, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={clsx(CONTAINER_BASE, CONTAINER_VARIANTS[variant], CONTAINER_SIZES[size], isDisabled && "opacity-50", className)}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#2563eb"} />
      ) : (
        <Text className={clsx(TEXT_VARIANTS[variant], TEXT_SIZES[size])}>{title}</Text>
      )}
    </Pressable>
  );
}
