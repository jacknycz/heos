import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachinePassport">;

// The anchor screen: identity + full history + quick actions into every logging flow.
// Inventory doc calls out Identity / History / Parts & Cost / Chat as the four tabs here —
// rendered flat for Day 1, split into real tabs once the passport has real data to show.
export function MachinePassportScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [passport, setPassport] = useState<any>(null);

  useEffect(() => {
    apiGet(`/machines/${machineId}`).then(setPassport).catch(() => {});
  }, [machineId]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{passport?.name ?? "Loading…"}</Text>
      <Text style={{ color: "#666" }}>
        {[passport?.make, passport?.model, passport?.year].filter(Boolean).join(" ")}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 }}>
        <Button title="Log Repair" onPress={() => navigation.navigate("RepairLogForm", { machineId })} />
        <Button title="Driver Note" onPress={() => navigation.navigate("DriverNoteForm", { machineId })} />
        <Button title="Hours/Distance" onPress={() => navigation.navigate("HoursEntryForm", { machineId })} />
        <Button title="Diagnostics" onPress={() => navigation.navigate("DiagnosticsForm", { machineId })} />
        <Button title="Chat" onPress={() => navigation.navigate("ChatThread", { machineId })} />
      </View>

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Repair history ({passport?.repairLogs?.length ?? 0})</Text>
      {passport?.repairLogs?.map((r: any) => (
        <Text key={r.id}>• {r.description} — ${(r.costCents / 100).toFixed(2)}</Text>
      ))}

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Driver notes ({passport?.driverNotes?.length ?? 0})</Text>
      {passport?.driverNotes?.map((n: any) => (
        <Text key={n.id}>• {n.text}</Text>
      ))}

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Parts & cost ({passport?.parts?.length ?? 0})</Text>
      {passport?.parts?.map((p: any) => (
        <Text key={p.id}>• {p.partNumber} — ${(p.costCents / 100).toFixed(2)}</Text>
      ))}
    </ScrollView>
  );
}
