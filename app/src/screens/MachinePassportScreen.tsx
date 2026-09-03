import { useEffect, useState } from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet } from "../api/client";
import { Screen, Text, Button, Card } from "../ui";

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
    <Screen scroll edges={["bottom"]}>
      <View>
        <Text variant="title">{passport?.name ?? "Loading…"}</Text>
        <Text variant="muted">{[passport?.make, passport?.model, passport?.year].filter(Boolean).join(" ")}</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" title="Log Repair" onPress={() => navigation.navigate("RepairLogForm", { machineId })} />
        <Button size="sm" title="Driver Note" onPress={() => navigation.navigate("DriverNoteForm", { machineId })} />
        <Button size="sm" title="Hours/Distance" onPress={() => navigation.navigate("HoursEntryForm", { machineId })} />
        <Button size="sm" title="Diagnostics" onPress={() => navigation.navigate("DiagnosticsForm", { machineId })} />
        <Button size="sm" title="Chat" variant="secondary" onPress={() => navigation.navigate("ChatThread", { machineId })} />
      </View>

      <Card className="gap-2">
        <Text variant="heading">Repair history ({passport?.repairLogs?.length ?? 0})</Text>
        {passport?.repairLogs?.length ? (
          passport.repairLogs.map((r: any) => (
            <Text key={r.id} variant="body">• {r.description} — ${(r.costCents / 100).toFixed(2)}</Text>
          ))
        ) : (
          <Text variant="muted">Nothing logged yet.</Text>
        )}
      </Card>

      <Card className="gap-2">
        <Text variant="heading">Driver notes ({passport?.driverNotes?.length ?? 0})</Text>
        {passport?.driverNotes?.length ? (
          passport.driverNotes.map((n: any) => <Text key={n.id} variant="body">• {n.text}</Text>)
        ) : (
          <Text variant="muted">Nothing logged yet.</Text>
        )}
      </Card>

      <Card className="gap-2">
        <Text variant="heading">Parts & cost ({passport?.parts?.length ?? 0})</Text>
        {passport?.parts?.length ? (
          passport.parts.map((p: any) => (
            <Text key={p.id} variant="body">• {p.partNumber} — ${(p.costCents / 100).toFixed(2)}</Text>
          ))
        ) : (
          <Text variant="muted">Nothing logged yet.</Text>
        )}
      </Card>
    </Screen>
  );
}
