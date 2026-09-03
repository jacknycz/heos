import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { apiGet } from "../api/client";
import { Screen, Text, EmptyState } from "../ui";

// Mobile manager dashboard — fleet status + repeat-order flags (Phase 1). Web version is Phase 3.
export function DashboardScreen() {
  const [repeatOrders, setRepeatOrders] = useState<{ partNumber: string; count: number }[]>([]);

  useEffect(() => {
    apiGet<{ partNumber: string; count: number }[]>("/parts/repeat-orders").then(setRepeatOrders).catch(() => {});
  }, []);

  return (
    <Screen edges={["top", "bottom"]}>
      <Text variant="title">Manager Dashboard</Text>
      <Text variant="heading">Repeat orders flagged</Text>
      <FlatList
        data={repeatOrders}
        keyExtractor={(r) => r.partNumber}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-200" />}
        ListEmptyComponent={<EmptyState title="None yet" />}
        renderItem={({ item }) => (
          <Text className="py-2">• {item.partNumber} ordered {item.count}× across the fleet</Text>
        )}
      />
    </Screen>
  );
}
