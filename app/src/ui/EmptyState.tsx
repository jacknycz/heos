import { View } from "react-native";
import { Text } from "./Text";

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="items-center gap-1 py-12">
      <Text variant="heading" className="text-neutral-500 dark:text-neutral-400">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="muted" className="text-center">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
