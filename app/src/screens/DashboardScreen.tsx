import { useCallback, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../navigation/RootNavigator";
import { apiGet } from "../api/client";
import { Screen, Text, EmptyState, Card, Accordion, Badge, Button } from "../ui";
import { LoginLogo } from "./auth/LoginLogo";

type RepeatOrder = { partNumber: string; count: number };
type Machine = {
  id: string;
  name: string;
  make?: string;
  model?: string;
  lastActivityAt: string;
  dueMilestonesCount: number;
  upcomingMilestonesCount: number;
};

type Props = BottomTabScreenProps<RootTabParamList, "Dashboard">;

// A plain list of machines inside an alert accordion: no card chrome, a hairline between rows,
// and the count badge inline on the right.
function AlertMachineRows({
  machines,
  badgeTone,
  badgeLabel,
  onPress,
}: {
  machines: Machine[];
  badgeTone: "danger" | "warning";
  badgeLabel: (m: Machine) => string;
  onPress: (m: Machine) => void;
}) {
  return (
    <View>
      {machines.map((m, i) => (
        <View key={m.id}>
          {i > 0 ? <View className="h-px bg-neutral-200 dark:bg-neutral-800" /> : null}
          <Pressable onPress={() => onPress(m)} className="flex-row items-center justify-between py-3 active:opacity-60">
            <View className="flex-1 pr-2">
              <Text variant="heading">{m.name}</Text>
              <Text variant="muted">{[m.make, m.model].filter(Boolean).join(" ") || "—"}</Text>
            </View>
            <Badge tone={badgeTone} label={badgeLabel(m)} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// Mobile manager dashboard — fleet status + repeat-order flags (Phase 1). Web version is Phase 3.
export function DashboardScreen({ navigation }: Props) {
  const [repeatOrders, setRepeatOrders] = useState<RepeatOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const { height } = useWindowDimensions();
  const openMilestones = (m: Machine) =>
    navigation.navigate("Machines", { screen: "MachinePassport", params: { machineId: m.id } });

  // Re-fetch on every focus, not just on mount — bottom-tab screens stay mounted after the
  // first visit, so a mount-only effect would never see a machine edit made in another tab
  // (e.g. renaming a machine from its passport) until a full app reload.
  useFocusEffect(
    useCallback(() => {
      apiGet<RepeatOrder[]>("/parts/repeat-orders").then(setRepeatOrders).catch(() => {});
      apiGet<Machine[]>("/machines").then(setMachines).catch(() => {});
    }, []),
  );

  // lastActivityAt (from the server) is the greater of the machine's own updatedAt (bumped on
  // every edit) and the latest timestamp across everything logged against it.
  const recentMachines = [...machines]
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    .slice(0, 3);
  const machinesWithDueMilestones = machines.filter((m) => m.dueMilestonesCount > 0);
  // Excludes machines already in the due list above — once something's overdue it belongs in
  // that more urgent card, not duplicated down here too.
  const machinesWithUpcomingMilestones = machines.filter((m) => m.dueMilestonesCount === 0 && m.upcomingMilestonesCount > 0);

  return (
    <Screen scroll edges={["top", "bottom"]} background="white" topGradient>
      <View className="flex-row items-center gap-3" style={{ marginBottom: height * 0.1 }}>
        <LoginLogo size={40} />
        <Text variant="title" className="text-white">
          Dashboard
        </Text>
      </View>

      {machinesWithDueMilestones.length > 0 ? (
        <Accordion
          tone="danger"
          icon="medkit"
          solid
          defaultExpanded={false}
          title={`${machinesWithDueMilestones.length} machine${machinesWithDueMilestones.length > 1 ? "s" : ""} overdue`}
        >
          <AlertMachineRows
            machines={machinesWithDueMilestones}
            badgeTone="danger"
            badgeLabel={(m) => `${m.dueMilestonesCount} due`}
            onPress={openMilestones}
          />
        </Accordion>
      ) : null}

      {machinesWithUpcomingMilestones.length > 0 ? (
        <Accordion
          tone="warning"
          icon="warning"
          solid
          defaultExpanded={false}
          title={`${machinesWithUpcomingMilestones.length} machine${machinesWithUpcomingMilestones.length > 1 ? "s" : ""} upcoming`}
        >
          <AlertMachineRows
            machines={machinesWithUpcomingMilestones}
            badgeTone="warning"
            badgeLabel={(m) => `${m.upcomingMilestonesCount} coming up`}
            onPress={openMilestones}
          />
        </Accordion>
      ) : null}

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="section">Machines</Text>
          <Button variant="outline" size="sm" title="View all" onPress={() => navigation.navigate("Machines", { screen: "MachineList" })} />
        </View>
        {recentMachines.length === 0 ? (
          <EmptyState title="No machines yet" />
        ) : (
          <View className="gap-2">
            {recentMachines.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => navigation.navigate("Machines", { screen: "MachinePassport", params: { machineId: m.id } })}
              >
                <Card className="flex-row items-center justify-between">
                  <View>
                    <Text variant="heading">{m.name}</Text>
                    <Text variant="muted">{[m.make, m.model].filter(Boolean).join(" ") || "—"}</Text>
                  </View>
                  <Text variant="muted">{new Date(m.lastActivityAt).toLocaleDateString()}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View className="gap-2">
        <Text variant="section">Repeat orders flagged</Text>
        {repeatOrders.length === 0 ? (
          <EmptyState title="None yet" />
        ) : (
          <View className="gap-1">
            {repeatOrders.map((r) => (
              <Text key={r.partNumber} className="py-2">
                • {r.partNumber} ordered {r.count}× across the fleet
              </Text>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
