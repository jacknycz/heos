import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MachinesStack } from "./MachinesStack";
import { SettingsStack } from "./SettingsStack";
import { DashboardScreen } from "../screens/DashboardScreen";

// Bottom-tab shell: Machines (passport + logging flows), Dashboard (manager view), Settings.
// Matches the Phase 1 screen inventory doc's top-level groups. Only shown once signed in — see App.tsx.
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Machines" component={MachinesStack} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
