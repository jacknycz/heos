import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { apiGet } from "../api/client";

// Mobile manager dashboard — fleet status + repeat-order flags (Phase 1). Web version is Phase 3.
export function DashboardScreen() {
  const [repeatOrders, setRepeatOrders] = useState<{ partNumber: string; count: number }[]>([]);

  useEffect(() => {
    apiGet<{ partNumber: string; count: number }[]>("/parts/repeat-orders").then(setRepeatOrders).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Manager Dashboard</Text>
      <Text style={{ fontWeight: "600" }}>Repeat orders flagged</Text>
      <FlatList
        data={repeatOrders}
        keyExtractor={(r) => r.partNumber}
        ListEmptyComponent={<Text style={{ color: "#666" }}>None yet.</Text>}
        renderItem={({ item }) => (
          <Text>
            • {item.partNumber} ordered {item.count}× across the fleet
          </Text>
        )}
      />
    </View>
  );
}
