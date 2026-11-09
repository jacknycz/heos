import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";

// Also doubles as the "couldn't load" state for a failed fetch (pass onRetry) — same shape as a
// genuine empty result, just with a retry action, so a dead API isn't visually indistinguishable
// from an org that really has nothing yet.
export function EmptyState({ title, subtitle, onRetry }: { title: string; subtitle?: string; onRetry?: () => void }) {
  return (
    <View className="items-center gap-2 py-12">
      <Text variant="heading" className="text-neutral-500 dark:text-neutral-400">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="muted" className="text-center">
          {subtitle}
        </Text>
      ) : null}
      {onRetry ? <Button size="sm" variant="secondary" title="Try again" onPress={onRetry} /> : null}
    </View>
  );
}
