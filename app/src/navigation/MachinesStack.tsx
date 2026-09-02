import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MachineListScreen } from "../screens/MachineListScreen";
import { MachinePassportScreen } from "../screens/MachinePassportScreen";
import { RepairLogFormScreen } from "../screens/RepairLogFormScreen";
import { DriverNoteFormScreen } from "../screens/DriverNoteFormScreen";
import { HoursEntryFormScreen } from "../screens/HoursEntryFormScreen";
import { DiagnosticsFormScreen } from "../screens/DiagnosticsFormScreen";
import { ChatThreadScreen } from "../screens/ChatThreadScreen";

export type MachinesStackParamList = {
  MachineList: undefined;
  MachinePassport: { machineId: string };
  RepairLogForm: { machineId: string };
  DriverNoteForm: { machineId: string };
  HoursEntryForm: { machineId: string };
  DiagnosticsForm: { machineId: string };
  ChatThread: { machineId: string };
};

const Stack = createNativeStackNavigator<MachinesStackParamList>();

export function MachinesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MachineList" component={MachineListScreen} options={{ title: "Fleet" }} />
      <Stack.Screen name="MachinePassport" component={MachinePassportScreen} options={{ title: "Machine Passport" }} />
      <Stack.Screen name="RepairLogForm" component={RepairLogFormScreen} options={{ title: "Log a Repair" }} />
      <Stack.Screen name="DriverNoteForm" component={DriverNoteFormScreen} options={{ title: "Driver Note" }} />
      <Stack.Screen name="HoursEntryForm" component={HoursEntryFormScreen} options={{ title: "Hours & Distance" }} />
      <Stack.Screen name="DiagnosticsForm" component={DiagnosticsFormScreen} options={{ title: "Diagnostics" }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: "Chat" }} />
    </Stack.Navigator>
  );
}
