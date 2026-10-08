import { Pressable, View } from "react-native";
import clsx from "clsx";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../../navigation/MachinesStack";
import { Badge, Card, Text } from "../../ui";

type RepairLog = { id: string; description: string; costCents: number; createdAt: string };
type DriverNote = { id: string; text: string; createdAt: string };
type HoursEntry = { id: string; hours: number | null; distance: number | null; recordedAt: string };
type DiagnosticEntry = { id: string; checklistName: string; createdAt: string };
type MilestoneRecord = {
  id: string;
  label: string;
  type: "recurring" | "one_time";
  thresholdValue: number;
  lastCompletedAtValue: number | null;
  lastCompletedAt: string | null;
  isDue: boolean;
};
type ChatSummary = { id: string; summary: string; coveredThroughMessageId: string; createdAt: string };
type AiLog = { id: string; content: string; createdAt: string };

type HistoryItem =
  | { kind: "repair"; id: string; timestamp: string; repairLog: RepairLog }
  | { kind: "note"; id: string; timestamp: string; driverNote: DriverNote }
  | { kind: "hours"; id: string; timestamp: string; hoursEntry: HoursEntry }
  | { kind: "diagnostic"; id: string; timestamp: string; diagnosticEntry: DiagnosticEntry }
  | { kind: "milestone"; id: string; timestamp: string; milestone: MilestoneRecord }
  | { kind: "chatSummary"; id: string; timestamp: string; chatSummary: ChatSummary }
  | { kind: "aiLog"; id: string; timestamp: string; aiLog: AiLog };

type Props = {
  machineId: string;
  repairLogs: RepairLog[];
  driverNotes: DriverNote[];
  hoursEntries: HoursEntry[];
  diagnosticEntries: DiagnosticEntry[];
  milestones: MilestoneRecord[];
  chatSummaries: ChatSummary[];
  aiLogs: AiLog[];
  trackingUnit: "hours" | "miles";
  navigation: NativeStackNavigationProp<MachinesStackParamList>;
};

const DOT_COLORS: Record<HistoryItem["kind"], string> = {
  repair: "bg-primary-600",
  note: "bg-warning-500",
  hours: "bg-neutral-400",
  diagnostic: "bg-success-500",
  milestone: "bg-success-600",
  chatSummary: "bg-neutral-600",
  aiLog: "bg-primary-400",
};

const LABELS: Record<HistoryItem["kind"], string> = {
  repair: "Repair",
  note: "Driver Note",
  hours: "Hours/Distance",
  diagnostic: "Diagnostic",
  milestone: "Milestone",
  chatSummary: "AI Summary",
  aiLog: "AI Log",
};

const TONES: Record<HistoryItem["kind"], "primary" | "warning" | "neutral" | "success"> = {
  repair: "primary",
  note: "warning",
  hours: "neutral",
  diagnostic: "success",
  milestone: "success",
  chatSummary: "neutral",
  aiLog: "neutral",
};

// Everything that's happened to this machine, as a timeline — repairs, driver notes,
// hours/distance entries, diagnostics, and completed milestones, dot-and-rail down the left,
// so nobody has to go hunting across separate sections to piece together its story. Milestones
// that are currently due surface as a banner above instead — they don't have a real date yet,
// just a value they're due at, so they don't fit the date-ordered line below.
export function HistoryTab({
  machineId,
  repairLogs,
  driverNotes,
  hoursEntries,
  diagnosticEntries,
  milestones,
  chatSummaries,
  aiLogs,
  trackingUnit,
  navigation,
}: Props) {
  const dueMilestones = milestones.filter((m) => m.isDue);
  const unitLabel = trackingUnit === "hours" ? "hrs" : "mi";

  const items: HistoryItem[] = [
    ...repairLogs.map((r): HistoryItem => ({ kind: "repair", id: r.id, timestamp: r.createdAt, repairLog: r })),
    ...driverNotes.map((n): HistoryItem => ({ kind: "note", id: n.id, timestamp: n.createdAt, driverNote: n })),
    ...hoursEntries.map((h): HistoryItem => ({ kind: "hours", id: h.id, timestamp: h.recordedAt, hoursEntry: h })),
    ...diagnosticEntries.map((d): HistoryItem => ({ kind: "diagnostic", id: d.id, timestamp: d.createdAt, diagnosticEntry: d })),
    ...milestones
      .filter((m) => m.lastCompletedAt)
      .map((m): HistoryItem => ({ kind: "milestone", id: m.id, timestamp: m.lastCompletedAt as string, milestone: m })),
    ...chatSummaries.map((s): HistoryItem => ({ kind: "chatSummary", id: s.id, timestamp: s.createdAt, chatSummary: s })),
    ...aiLogs.map((a): HistoryItem => ({ kind: "aiLog", id: a.id, timestamp: a.createdAt, aiLog: a })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <View className="gap-3">
      {dueMilestones.length > 0 ? (
        <Card variant="danger" className="gap-1">
          <Text variant="heading" className="text-danger-700">
            {dueMilestones.length} milestone{dueMilestones.length > 1 ? "s" : ""} due
          </Text>
          {dueMilestones.map((m) => (
            <Text key={m.id} className="text-danger-700">
              • {m.label} ({m.type === "recurring" ? `every ${m.thresholdValue}` : `at ${m.thresholdValue}`} {unitLabel})
            </Text>
          ))}
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <Text variant="muted">Nothing logged yet.</Text>
        </Card>
      ) : (
        <View>
          {items.map((item, index) => (
            <View key={`${item.kind}-${item.id}`} className="flex-row gap-3">
              <View className="w-3 items-center">
                <View className={clsx("mt-1.5 h-3 w-3 rounded-full", DOT_COLORS[item.kind])} />
                {index < items.length - 1 ? <View className="w-px flex-1 bg-neutral-200" /> : null}
              </View>
              <Card className="mb-3 flex-1 flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Badge label={LABELS[item.kind]} tone={TONES[item.kind]} />
                    <Text variant="muted">{new Date(item.timestamp).toLocaleDateString()}</Text>
                  </View>
                  {item.kind === "repair" ? (
                    <Text variant="body">
                      {item.repairLog.description} — ${(item.repairLog.costCents / 100).toFixed(2)}
                    </Text>
                  ) : null}
                  {item.kind === "note" ? <Text variant="body">{item.driverNote.text}</Text> : null}
                  {item.kind === "hours" ? (
                    <Text variant="body">
                      {item.hoursEntry.hours ?? "—"} hrs / {item.hoursEntry.distance ?? "—"} dist
                    </Text>
                  ) : null}
                  {item.kind === "diagnostic" ? <Text variant="body">{item.diagnosticEntry.checklistName}</Text> : null}
                  {item.kind === "milestone" ? (
                    <Text variant="body">
                      {item.milestone.label} completed at {item.milestone.lastCompletedAtValue} {unitLabel}
                    </Text>
                  ) : null}
                  {item.kind === "chatSummary" ? <Text variant="body">{item.chatSummary.summary}</Text> : null}
                  {item.kind === "aiLog" ? <Text variant="body">{item.aiLog.content}</Text> : null}
                </View>
                {item.kind === "repair" ? (
                  <Pressable
                    onPress={() =>
                      navigation.navigate("RepairLogForm", {
                        machineId,
                        repairLog: { id: item.repairLog.id, description: item.repairLog.description, costCents: item.repairLog.costCents },
                      })
                    }
                  >
                    <Text className="font-semibold text-primary-600">Edit</Text>
                  </Pressable>
                ) : null}
                {item.kind === "note" ? (
                  <Pressable
                    onPress={() =>
                      navigation.navigate("DriverNoteForm", { machineId, driverNote: { id: item.driverNote.id, text: item.driverNote.text } })
                    }
                  >
                    <Text className="font-semibold text-primary-600">Edit</Text>
                  </Pressable>
                ) : null}
              </Card>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
