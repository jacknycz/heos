import { useState } from "react";
import { Pressable, View } from "react-native";
import { Badge, Button, Card, ConfirmDialog, Text } from "../../ui";
import { useAuth } from "../../auth/AuthContext";

export type Milestone = {
  id: string;
  label: string;
  type: "recurring" | "one_time";
  thresholdValue: number;
  lastCompletedAtValue: number | null;
  lastCompletedAt: string | null;
  nextDueAtValue: number | null;
  isDue: boolean;
  isComplete: boolean;
};

// The machine's maintenance milestones, shown as a card on the Identity tab. Each milestone is a
// hairline-separated row, matching the dashboard alert lists.
export function MilestonesCard({
  milestones,
  trackingUnit,
  currentTrackingValue,
  onAddPress,
  onEditPress,
  onCompletePress,
  onDeletePress,
}: {
  milestones: Milestone[];
  trackingUnit: "hours" | "miles";
  currentTrackingValue: number | null;
  onAddPress: () => void;
  onEditPress: (milestone: Milestone) => void;
  onCompletePress: (milestone: Milestone) => void;
  onDeletePress: (milestone: Milestone) => void;
}) {
  const { user } = useAuth();
  // Mirrors the server's role gates (see server/src/routes/milestones.ts): defining/editing/
  // deleting the PM schedule is fleet-management work, while marking one done is the mechanic's
  // own action on top of that.
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canComplete = canManage || user?.role === "MECHANIC";
  const [pendingDelete, setPendingDelete] = useState<Milestone | null>(null);
  const unitLabel = trackingUnit === "hours" ? "hrs" : "mi";

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">Milestones</Text>
        {canManage ? <Button size="sm" variant="secondary" title="Add Milestone" onPress={onAddPress} /> : null}
      </View>
      <Text variant="muted">Current reading: {currentTrackingValue != null ? `${currentTrackingValue} ${unitLabel}` : "not logged yet"}</Text>

      {milestones.length === 0 ? (
        <Text variant="muted">No milestones set up yet.</Text>
      ) : (
        <View>
          {milestones.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <View className="h-px bg-neutral-200 dark:bg-neutral-800" /> : null}
              <View className="gap-2 py-3">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 gap-1">
                    <Text variant="heading">{m.label}</Text>
                    <Text variant="muted">
                      {m.type === "recurring" ? `Every ${m.thresholdValue} ${unitLabel}` : `At ${m.thresholdValue} ${unitLabel}`}
                    </Text>
                  </View>
                  {m.isComplete ? (
                    <Badge label="Done" tone="neutral" />
                  ) : m.isDue ? (
                    <Badge label="Due now" tone="danger" />
                  ) : (
                    <Badge label={`Due at ${m.nextDueAtValue}`} tone="warning" />
                  )}
                </View>
                <View className="flex-row flex-wrap gap-4">
                  {!m.isComplete && canComplete ? (
                    <Pressable onPress={() => onCompletePress(m)}>
                      <Text className="font-semibold text-primary-600">Mark Done</Text>
                    </Pressable>
                  ) : null}
                  {canManage ? (
                    <>
                      <Pressable onPress={() => onEditPress(m)}>
                        <Text className="font-semibold text-primary-600">Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => setPendingDelete(m)}>
                        <Text className="font-semibold text-danger-600">Delete</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete this milestone?"
        message="This can't be undone."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDeletePress(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </Card>
  );
}
