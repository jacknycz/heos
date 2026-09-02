import { useState } from "react";
import { Button, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "DiagnosticsForm">;

// Placeholder guided checklist — real checklist content/steps are a Day 2+ item once
// we know which machine types/checklists the fleet actually needs first.
export function DiagnosticsFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [answers, setAnswers] = useState<Record<string, boolean>>({ "Engine starts cleanly": true });

  async function submit() {
    await apiPost("/diagnostics", { machineId, checklistName: "General Checklist", answers });
    navigation.goBack();
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>Guided checklist (placeholder — real steps TBD)</Text>
      <Button title="Complete Checklist" onPress={submit} />
    </View>
  );
}
