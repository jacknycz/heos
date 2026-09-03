import { View, type ViewProps } from "react-native";
import clsx from "clsx";

export function Card({ className, ...props }: ViewProps) {
  return <View className={clsx("rounded-card border border-neutral-200 bg-white p-4", className)} {...props} />;
}
