import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { MachineListScreen } from "../screens/MachineListScreen";
import { MachineFormScreen } from "../screens/MachineFormScreen";
import { MachinePassportScreen } from "../screens/MachinePassportScreen";
import { RepairLogFormScreen } from "../screens/RepairLogFormScreen";
import { DriverNoteFormScreen } from "../screens/DriverNoteFormScreen";
import { PartFormScreen } from "../screens/PartFormScreen";
import { MilestoneFormScreen } from "../screens/MilestoneFormScreen";
import { primary } from "../theme/palette";
import { useHeaderTheme } from "./useHeaderTheme";

export type MachineRecord = {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  serialOrVin?: string | null;
  trackingUnit: "hours" | "miles";
  engineNumber?: string | null;
  fleetNumber?: string | null;
  registrationNumber?: string | null;
  registrationExpiresAt?: string | null;
  locationId?: string | null;
};

export type MachinesStackParamList = {
  MachineList: undefined;
  // machine present means "editing that machine" — absent means "creating a new one".
  MachineForm: { machine?: MachineRecord };
  MachinePassport: { machineId: string };
  // repairLog/driverNote present means "editing that record" — absent means "logging a new one".
  RepairLogForm: { machineId: string; repairLog?: { id: string; description: string; costCents: number } };
  DriverNoteForm: { machineId: string; driverNote?: { id: string; text: string } };
  PartForm: {
    machineId: string;
    part?: {
      id: string;
      partNumber: string;
      description?: string | null;
      costCents: number;
      receipts: { id: string; image: string }[];
    };
  };
  MilestoneForm: {
    machineId: string;
    trackingUnit: "hours" | "miles";
    currentTrackingValue: number | null;
    milestone?: { id: string; label: string; type: "recurring" | "one_time"; thresholdValue: number };
  };
};

const Stack = createNativeStackNavigator<MachinesStackParamList>();

export function MachinesStack() {
  const header = useHeaderTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: header.background },
        headerTintColor: header.text,
        headerTitleStyle: { color: header.text },
      }}
    >
      <Stack.Screen
        name="MachineList"
        component={MachineListScreen}
        options={({ navigation }) => ({
          title: "Fleet",
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate("MachineForm", {})} hitSlop={8}>
              <Ionicons name="add" size={26} color={primary[600]} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="MachineForm"
        component={MachineFormScreen}
        options={({ route }) => ({
          title: route.params.machine ? "Edit Machine" : "New Machine",
        })}
      />
      <Stack.Screen
        name="MachinePassport"
        component={MachinePassportScreen}
        options={({ navigation }) => ({
          // Placeholder until the passport loads, then MachinePassportScreen's own
          // useLayoutEffect overwrites this with the machine's real name + subtitle.
          title: "Loading…",
          // Reached directly from the Dashboard's "recent machines" links too, which land here
          // as the only route in this stack. navigation.canGoBack() isn't reliable for deciding
          // where to go — it bubbles up to the tab navigator's own back-history, so it reports
          // true and goBack() would switch to the previously-focused tab (Dashboard) instead of
          // popping here. Check this stack's own depth instead.
          headerLeft: () => (
            <Pressable
              onPress={() =>
                navigation.getState().index > 0
                  ? navigation.goBack()
                  : navigation.reset({ index: 0, routes: [{ name: "MachineList" }] })
              }
              hitSlop={8}
              className="pr-2"
            >
              <Ionicons name="chevron-back" size={26} color={header.text} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="RepairLogForm"
        component={RepairLogFormScreen}
        options={({ route }) => ({
          title: route.params.repairLog ? "Edit Repair" : "Log a Repair",
        })}
      />
      <Stack.Screen
        name="DriverNoteForm"
        component={DriverNoteFormScreen}
        options={({ route }) => ({
          title: route.params.driverNote ? "Edit Driver Note" : "Driver Note",
        })}
      />
      <Stack.Screen
        name="PartForm"
        component={PartFormScreen}
        options={({ route }) => ({
          title: route.params.part ? "Edit Part" : "Add Part",
        })}
      />
      <Stack.Screen
        name="MilestoneForm"
        component={MilestoneFormScreen}
        options={({ route }) => ({
          title: route.params.milestone ? "Edit Milestone" : "Add Milestone",
        })}
      />
    </Stack.Navigator>
  );
}
