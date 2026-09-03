import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";
import { Screen, Text, Button } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "DiagnosticsForm">;

// Placeholder guided checklist — real checklist content/steps are a Day 2+ item once
// we know which machine types/checklists the fleet actually needs first.
export function DiagnosticsFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [answers] = useState<Record<string, boolean>>({ "Engine starts cleanly": true });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await apiPost("/diagnostics", { machineId, checklistName: "General Checklist", answers });
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={["bottom"]}>
      <Text variant="muted">Guided checklist (placeholder — real steps TBD)</Text>
      <Button title="Complete Checklist" onPress={submit} loading={submitting} />
    </Screen>
  );
}
