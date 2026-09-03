import { View } from "react-native";
import clsx from "clsx";
import { Text } from "./Text";

type Tone = "primary" | "neutral" | "success" | "warning" | "danger";

const TONES: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-100", text: "text-primary-700" },
  neutral: { bg: "bg-neutral-100", text: "text-neutral-700" },
  success: { bg: "bg-success-100", text: "text-success-700" },
  warning: { bg: "bg-warning-100", text: "text-warning-700" },
  danger: { bg: "bg-danger-100", text: "text-danger-700" },
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
