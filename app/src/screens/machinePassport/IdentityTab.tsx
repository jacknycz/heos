import { View } from "react-native";
import { Button, Card, Text } from "../../ui";
import { MilestonesCard, type Milestone } from "./MilestonesCard";
import { useAuth } from "../../auth/AuthContext";

// "YYYY-MM-DD" parsed via new Date(string) is treated as UTC midnight, which can render as the
// wrong calendar day depending on the viewer's timezone — parse the components as local instead.
function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

type Machine = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  location?: { name: string } | null;
  serialOrVin?: string | null;
  trackingUnit: "hours" | "miles";
  currentTrackingValue: number | null;
  engineNumber?: string | null;
  fleetNumber?: string | null;
  registrationNumber?: string | null;
  registrationExpiresAt?: string | null;
};

// ADDITIONAL FIELDS NEEDED: trim, and at-a-glance equipment specs (horsepower, operating
// weight, etc.) — the machines table has no columns for these yet. Tracked in PROGRESS.md;
// revisit once it's clear which specs actually matter per manufacturer.
export function IdentityTab({
  machine,
  milestones,
  onEditPress,
  onAddMilestone,
  onEditMilestone,
  onCompleteMilestone,
  onDeleteMilestone,
}: {
  machine: Machine;
  milestones: Milestone[];
  onEditPress: () => void;
  onAddMilestone: () => void;
  onEditMilestone: (milestone: Milestone) => void;
  onCompleteMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (milestone: Milestone) => void;
}) {
  const { user } = useAuth();
  // Mirrors the server (see server/src/routes/machines.ts): editing a machine's identity is
  // fleet-management work, not a mechanic/driver action.
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const unitLabel = machine.trackingUnit === "hours" ? "Hours" : "Miles";
  // "Next" by threshold value, not creation order — whichever is closest (or already past due)
  // is what actually matters here, completed one-time milestones (nextDueAtValue null) excluded.
  const nextMilestone = milestones
    .filter((m) => m.nextDueAtValue != null)
    .sort((a, b) => (a.nextDueAtValue as number) - (b.nextDueAtValue as number))[0];

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Make", value: machine.make },
    { label: "Model", value: machine.model },
    { label: "Location", value: machine.location?.name },
    { label: "Year", value: machine.year?.toString() },
    { label: "Serial / VIN", value: machine.serialOrVin },
    { label: "Tracked in", value: unitLabel },
    { label: "Engine number", value: machine.engineNumber },
    { label: "Fleet number", value: machine.fleetNumber },
    { label: "Registration #", value: machine.registrationNumber },
    {
      label: "Registration expires",
      value: machine.registrationExpiresAt ? formatDateOnly(machine.registrationExpiresAt) : undefined,
    },
  ];

  return (
    <View className="gap-3">
      <Card className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text variant="heading">Current {unitLabel}</Text>
          <Text variant="heading" className="text-primary-600">
            {machine.currentTrackingValue != null ? machine.currentTrackingValue : "Not logged yet"}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-t border-neutral-100 pt-2">
          {nextMilestone ? (
            <>
              <Text variant="label">Next: {nextMilestone.label}</Text>
              <Text className={nextMilestone.isDue ? "font-semibold text-danger-600" : "text-neutral-700"}>
                {nextMilestone.isDue ? "Due now" : `Due at ${nextMilestone.nextDueAtValue}`}
              </Text>
            </>
          ) : (
            <Text variant="muted">No milestones set up</Text>
          )}
        </View>
      </Card>

      <MilestonesCard
        milestones={milestones}
        trackingUnit={machine.trackingUnit}
        currentTrackingValue={machine.currentTrackingValue}
        onAddPress={onAddMilestone}
        onEditPress={onEditMilestone}
        onCompletePress={onCompleteMilestone}
        onDeletePress={onDeleteMilestone}
      />

      <Card className="gap-3">
        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center justify-between">
            <Text variant="label">{row.label}</Text>
            <Text variant="body">{row.value || "—"}</Text>
          </View>
        ))}
      </Card>

      {canManage ? (
        <View className="flex-row justify-end">
          <Button size="sm" title="Edit" onPress={onEditPress} />
        </View>
      ) : null}
    </View>
  );
}
