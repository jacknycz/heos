import { useCallback, useLayoutEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiDelete, apiGet, apiPost } from "../api/client";
import { Screen, Text, Tabs, QuickActions, Sheet } from "../ui";
import { RepairLogForm } from "./RepairLogFormScreen";
import { DriverNoteForm } from "./DriverNoteFormScreen";
import { HoursEntryForm } from "./HoursEntryForm";
import { DiagnosticsForm } from "./DiagnosticsForm";
import { shadows } from "../theme/shadows";
import { white } from "../theme/palette";
import { IdentityTab } from "./machinePassport/IdentityTab";
import { HistoryTab } from "./machinePassport/HistoryTab";
import { PartsCostTab } from "./machinePassport/PartsCostTab";
import type { Milestone } from "./machinePassport/MilestonesCard";
import { ChatTab } from "./machinePassport/ChatTab";

type Passport = {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  serialOrVin?: string | null;
  trackingUnit: "hours" | "miles";
  currentTrackingValue: number | null;
  engineNumber?: string | null;
  fleetNumber?: string | null;
  registrationNumber?: string | null;
  registrationExpiresAt?: string | null;
  location?: { id: string; name: string; address?: string | null } | null;
  repairLogs: { id: string; description: string; costCents: number; createdAt: string }[];
  driverNotes: { id: string; text: string; createdAt: string }[];
  hoursEntries: { id: string; hours: number | null; distance: number | null; recordedAt: string }[];
  diagnosticEntries: { id: string; checklistName: string; createdAt: string }[];
  parts: {
    id: string;
    partNumber: string;
    description?: string | null;
    costCents: number;
    orderedAt: string;
    receivedAt: string | null;
    receipts: { id: string; image: string }[];
  }[];
  milestones: Milestone[];
  chatSummaries: { id: string; summary: string; coveredThroughMessageId: string; createdAt: string }[];
  aiLogs: { id: string; content: string; createdAt: string }[];
};

type TabKey = "identity" | "history" | "parts";

// Every slide-up sheet on this screen. Only one is open at a time.
type SheetKey = "repair" | "note" | "hours" | "diagnostics" | "chat";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachinePassport">;

// Floating chat button and sheet geometry. Positioned explicitly rather than with classes so the
// button always sits bottom right above the tab bar at a size you can actually tap.
const styles = StyleSheet.create({
  fab: { position: "absolute", right: 20, bottom: 20, width: 64, height: 64, borderRadius: 32 },
  sheet: { height: "85%" },
});

// Header title shows the machine's name + make/model/year in place of a static "Machine
// Passport" label — native-stack has no cross-platform subtitle option, so this is a custom
// two-line headerTitle instead.
function PassportHeaderTitle({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <View>
      <Text variant="heading" numberOfLines={1}>
        {name}
      </Text>
      {subtitle ? (
        <Text variant="muted" className="text-xs" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// The anchor screen: quick actions into every logging flow up top, then Identity / History /
// Parts & Cost as tabs below, with chat in a sheet opened from a floating button. All tabs read
// off one passport fetch, so logging anything and returning here refreshes every tab at once.
// Milestones' "Mark Done"/"Delete" are the one exception that don't navigate away, so they
// explicitly re-fetch afterward instead of relying on the focus-triggered one below.
export function MachinePassportScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [passport, setPassport] = useState<Passport | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("identity");
  const [activeSheet, setActiveSheet] = useState<SheetKey | null>(null);

  // Closing a sheet just dismisses it; finishing one also refreshes the passport so the new entry shows.
  const closeSheet = () => setActiveSheet(null);
  const finishSheet = () => {
    setActiveSheet(null);
    refetch();
  };

  const refetch = useCallback(() => {
    return apiGet<Passport>(`/machines/${machineId}`).then(setPassport).catch(() => {});
  }, [machineId]);

  // Re-fetch on every focus, not just on mount — each logging form navigates back here on
  // success, and a plain mount-only fetch left the passport showing stale data until reload.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // The navigator's static options set the header's back button and fallback title; this fills
  // in the real machine name + subtitle once the passport loads, without touching headerLeft.
  useLayoutEffect(() => {
    if (!passport) return;
    const subtitle = [passport.make, passport.model, passport.year].filter(Boolean).join(" ");
    navigation.setOptions({
      title: passport.name,
      headerTitle: () => <PassportHeaderTitle name={passport.name} subtitle={subtitle} />,
    });
  }, [navigation, passport]);

  return (
    <View className="flex-1">
      <Screen scroll edges={["bottom"]}>
        <QuickActions
          actions={[
            { title: "Log Repair", onPress: () => setActiveSheet("repair"), variant: "industrial" },
            { title: "Driver Note", onPress: () => setActiveSheet("note"), variant: "industrial" },
            { title: "Hours/Distance", onPress: () => setActiveSheet("hours"), variant: "industrial" },
            { title: "Diagnostics", onPress: () => setActiveSheet("diagnostics"), variant: "industrial" },
          ]}
        />

        {passport ? (
          <>
            <Tabs
              variant="icon"
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TabKey)}
              tabs={[
                { key: "identity", label: "Identity", icon: "information-circle" },
                { key: "history", label: "History", icon: "time" },
                { key: "parts", label: "Parts & Cost", icon: "cube" },
              ]}
            />

            {/* Every tab stays mounted (just hidden) instead of unmounting on switch, so each keeps
                its local state (scroll position, form drafts) when you glance at another tab. */}
            <View style={{ display: activeTab === "identity" ? "flex" : "none" }}>
              <IdentityTab
                machine={passport}
                milestones={passport.milestones}
                onAddMilestone={() =>
                  navigation.navigate("MilestoneForm", {
                    machineId,
                    trackingUnit: passport.trackingUnit,
                    currentTrackingValue: passport.currentTrackingValue,
                  })
                }
                onEditMilestone={(milestone) =>
                  navigation.navigate("MilestoneForm", {
                    machineId,
                    trackingUnit: passport.trackingUnit,
                    currentTrackingValue: passport.currentTrackingValue,
                    milestone,
                  })
                }
                onCompleteMilestone={(milestone) => apiPost(`/milestones/${milestone.id}/complete`, {}).then(refetch)}
                onDeleteMilestone={(milestone) => apiDelete(`/milestones/${milestone.id}`).then(refetch)}
                onEditPress={() =>
                  navigation.navigate("MachineForm", {
                    machine: {
                      id: passport.id,
                      name: passport.name,
                      make: passport.make,
                      model: passport.model,
                      year: passport.year,
                      serialOrVin: passport.serialOrVin,
                      trackingUnit: passport.trackingUnit,
                      engineNumber: passport.engineNumber,
                      fleetNumber: passport.fleetNumber,
                      registrationNumber: passport.registrationNumber,
                      registrationExpiresAt: passport.registrationExpiresAt,
                      locationId: passport.location?.id,
                    },
                  })
                }
              />
            </View>
            <View style={{ display: activeTab === "history" ? "flex" : "none" }}>
              <HistoryTab
                machineId={machineId}
                repairLogs={passport.repairLogs}
                driverNotes={passport.driverNotes}
                hoursEntries={passport.hoursEntries}
                diagnosticEntries={passport.diagnosticEntries}
                milestones={passport.milestones}
                chatSummaries={passport.chatSummaries}
                aiLogs={passport.aiLogs}
                trackingUnit={passport.trackingUnit}
                navigation={navigation}
              />
            </View>
            <View style={{ display: activeTab === "parts" ? "flex" : "none" }}>
              <PartsCostTab
                parts={passport.parts}
                onAddPress={() => navigation.navigate("PartForm", { machineId })}
                onEditPress={(part) => navigation.navigate("PartForm", { machineId, part })}
                onMarkReceived={(part) => apiPost(`/parts/${part.id}/receive`, {}).then(refetch)}
              />
            </View>
            {/* Clears the floating chat button so it never covers the last card. */}
            <View className="h-20" />
          </>
        ) : null}
      </Screen>

      <Pressable
        onPress={() => setActiveSheet("chat")}
        accessibilityRole="button"
        accessibilityLabel="Ask about this machine"
        className="items-center justify-center bg-primary-600"
        style={[styles.fab, shadows.glow]}
      >
        <Ionicons name="chatbubble-ellipses" size={30} color={white} />
      </Pressable>

      <Sheet visible={activeSheet === "repair"} title="Log a Repair" onClose={closeSheet}>
        <RepairLogForm machineId={machineId} onDone={finishSheet} />
      </Sheet>
      <Sheet visible={activeSheet === "note"} title="Driver Note" onClose={closeSheet}>
        <DriverNoteForm machineId={machineId} onDone={finishSheet} />
      </Sheet>
      <Sheet visible={activeSheet === "hours"} title="Hours & Distance" onClose={closeSheet}>
        <HoursEntryForm machineId={machineId} onDone={finishSheet} />
      </Sheet>
      <Sheet visible={activeSheet === "diagnostics"} title="Diagnostics" onClose={closeSheet}>
        <DiagnosticsForm machineId={machineId} onDone={finishSheet} />
      </Sheet>
      <Sheet visible={activeSheet === "chat"} title="Ask about this machine" onClose={closeSheet}>
        <ChatTab machineId={machineId} onSummarySaved={refetch} />
      </Sheet>
    </View>
  );
}
