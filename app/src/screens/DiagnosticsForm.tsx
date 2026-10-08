import { useState } from "react";
import { ScrollView } from "react-native";
import { apiPost } from "../api/client";
import { Text, Button } from "../ui";

// Placeholder guided checklist, shown in the passport's sheet. Real checklist content/steps are a
// Day 2+ item once we know which machine types/checklists the fleet actually needs first.
export function DiagnosticsForm({ machineId, onDone }: { machineId: string; onDone: () => void }) {
  const [answers] = useState<Record<string, boolean>>({ "Engine starts cleanly": true });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await apiPost("/diagnostics", { machineId, checklistName: "General Checklist", answers });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4">
      <Text variant="muted">Guided checklist (placeholder — real steps TBD)</Text>
      <Button title="Complete Checklist" onPress={submit} loading={submitting} />
    </ScrollView>
  );
}
