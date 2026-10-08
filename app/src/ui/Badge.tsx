import { View } from "react-native";
import clsx from "clsx";
import { Text } from "./Text";

type Tone = "primary" | "neutral" | "success" | "warning" | "danger";

const TONES: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-100 dark:bg-primary-900", text: "text-primary-700 dark:text-primary-300" },
  neutral: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-700 dark:text-neutral-300" },
  success: { bg: "bg-success-100 dark:bg-success-900", text: "text-success-700 dark:text-success-300" },
  warning: { bg: "bg-warning-100 dark:bg-warning-900", text: "text-warning-700 dark:text-warning-300" },
  danger: { bg: "bg-danger-100 dark:bg-danger-900", text: "text-danger-700 dark:text-danger-300" },
};

// Small role/status pill — used for role tags (ADMIN/MANAGER/...) and similar labels.
export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { bg, text } = TONES[tone];
  return (
    <View className={clsx("self-start rounded-full px-2.5 py-1", bg)}>
      <Text className={clsx("text-xs font-semibold", text)}>{label}</Text>
    </View>
  );
}
