import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import type { RootTabParamList } from "../navigation/RootNavigator";
import { apiGet } from "../api/client";
import { Screen, Text, EmptyState, Card, Accordion, Badge, Button } from "../ui";
import { LoginLogo } from "./auth/LoginLogo";
import { danger, neutral, primary, warning, white } from "../theme/palette";
import { shadows } from "../theme/shadows";

type RepeatOrder = { partNumber: string; count: number };
type OrderStatus = {
  awaiting: { id: string; partNumber: string; orderedAt: string; machineId: string; machineName: string }[];
  receivedCount: number;
};
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

// A KPI-card-style header for the alert accordions below: icon badge + a large bold count +
// a short caption, in place of Accordion's default "heading" title treatment. Accordion's
// built-in color crossfade only applies to a plain string title, so this reads its own expanded
// state (passed down from the screen, via Accordion's onToggle) to switch between "white on the
// solid tone background" (collapsed) and "tone-tinted on white" (expanded) itself.
function AlertStatHeader({
  icon,
  count,
  label,
  tone,
  expanded,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  label: string;
  tone: "danger" | "warning";
  expanded: boolean;
}) {
  const badgeBg = expanded ? (tone === "danger" ? "bg-danger-100 dark:bg-danger-900" : "bg-warning-100 dark:bg-warning-900") : "bg-white/20";
  const countClass = expanded
    ? tone === "danger"
      ? "text-danger-700 dark:text-danger-300"
      : "text-warning-800 dark:text-warning-200"
    : "text-white";
  const labelClass = expanded ? "text-neutral-500 dark:text-neutral-400" : "text-white/80";
  const iconColor = expanded ? (tone === "danger" ? danger[600] : warning[600]) : white;

  return (
    <View className="flex-row items-center gap-3 py-0.5">
      <View className={clsx("size-11 items-center justify-center rounded-2xl", badgeBg)}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View>
        <Text className={clsx("text-3xl font-extrabold leading-tight", countClass)}>{count}</Text>
        <Text className={clsx("text-xs font-semibold uppercase tracking-wide", labelClass)}>{label}</Text>
      </View>
    </View>
  );
}

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

// Mobile manager dashboard — fleet status, order fulfillment + repeat-order flags (Phase 1). Web version is Phase 3.
export function DashboardScreen({ navigation }: Props) {
  const [repeatOrders, setRepeatOrders] = useState<RepeatOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({ awaiting: [], receivedCount: 0 });
  const [dueExpanded, setDueExpanded] = useState(false);
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);
  // Only the very first load shows a full-screen spinner — refocusing (e.g. back from a passport
  // edit) re-fetches silently so the dashboard doesn't flicker away while it reloads.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { height } = useWindowDimensions();
  const openPassport = (machineId: string) => navigation.navigate("Machines", { screen: "MachinePassport", params: { machineId }, initial: false });
  const openMilestones = (m: Machine) => openPassport(m.id);

  const fetchAll = useCallback(() => {
    setError(false);
    Promise.all([apiGet<RepeatOrder[]>("/parts/repeat-orders"), apiGet<Machine[]>("/machines"), apiGet<OrderStatus>("/parts/order-status")])
      .then(([repeatOrderRows, machineRows, orderStatusRow]) => {
        setRepeatOrders(repeatOrderRows);
        setMachines(machineRows);
        setOrderStatus(orderStatusRow);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch on every focus, not just on mount — bottom-tab screens stay mounted after the
  // first visit, so a mount-only effect would never see a machine edit made in another tab
  // (e.g. renaming a machine from its passport) until a full app reload.
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  // lastActivityAt (from the server) is the greater of the machine's own updatedAt (bumped on
  // every edit) and the latest timestamp across everything logged against it.
  const recentMachines = [...machines].sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()).slice(0, 3);
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

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color={neutral[500]} />
        </View>
      ) : error ? (
        <EmptyState title="Couldn't load the dashboard" subtitle="Check your connection and try again." onRetry={fetchAll} />
      ) : (
        <>
          {machinesWithDueMilestones.length > 0 ? (
            <Accordion
              tone="danger"
              solid
              defaultExpanded={false}
              onToggle={setDueExpanded}
              title={
                <AlertStatHeader
                  icon="medkit"
                  count={machinesWithDueMilestones.length}
                  label={machinesWithDueMilestones.length === 1 ? "Machine overdue" : "Machines overdue"}
                  tone="danger"
                  expanded={dueExpanded}
                />
              }
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
              solid
              defaultExpanded={false}
              onToggle={setUpcomingExpanded}
              title={
                <AlertStatHeader
                  icon="warning"
                  count={machinesWithUpcomingMilestones.length}
                  label={machinesWithUpcomingMilestones.length === 1 ? "Machine upcoming" : "Machines upcoming"}
                  tone="warning"
                  expanded={upcomingExpanded}
                />
              }
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
                  <Pressable key={m.id} onPress={() => openPassport(m.id)}>
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

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="section">Orders</Text>
              <Text variant="muted">
                {orderStatus.awaiting.length} awaiting · {orderStatus.receivedCount} received
              </Text>
            </View>
            {orderStatus.awaiting.length === 0 ? (
              <EmptyState title="Nothing awaiting delivery" />
            ) : (
              // Same row recipe as "Repeat orders flagged" below.
              <View className="overflow-hidden rounded-card bg-white dark:bg-neutral-900" style={shadows.subtle}>
                {orderStatus.awaiting.map((o, i) => (
                  <View key={o.id}>
                    {i > 0 ? <View className="h-px bg-neutral-200 dark:bg-neutral-800" /> : null}
                    <Pressable onPress={() => openPassport(o.machineId)} className="flex-row items-center gap-3 p-4 active:opacity-60">
                      <View className="size-10 items-center justify-center rounded-2xl bg-warning-100 dark:bg-warning-900">
                        <Ionicons name="cube-outline" size={18} color={warning[600]} />
                      </View>
                      <View className="flex-1">
                        <Text variant="heading">{o.partNumber}</Text>
                        <Text variant="muted">
                          {o.machineName} · ordered {new Date(o.orderedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Badge tone="warning" label="Ordered" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="gap-3">
            <Text variant="section">Repeat orders flagged</Text>
            {repeatOrders.length === 0 ? (
              <EmptyState title="None yet" />
            ) : (
              // Same recipe as Card (rounded-card, white/neutral-900 surface, shadows.subtle) built
              // directly rather than via <Card>, since Card bakes in p-4 and each row here wants its
              // own padding instead — the same reason AlertMachineRows above isn't Card-wrapped either.
              <View className="overflow-hidden rounded-card bg-white dark:bg-neutral-900" style={shadows.subtle}>
                {repeatOrders.map((r, i) => (
                  <View key={r.partNumber}>
                    {i > 0 ? <View className="h-px bg-neutral-200 dark:bg-neutral-800" /> : null}
                    <View className="flex-row items-center gap-3 p-4">
                      <View className="size-10 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900">
                        <Ionicons name="repeat" size={18} color={primary[600]} />
                      </View>
                      <View className="flex-1">
                        <Text variant="heading">{r.partNumber}</Text>
                        <Text variant="muted">ordered across the fleet</Text>
                      </View>
                      <Badge tone="primary" label={`×${r.count}`} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
