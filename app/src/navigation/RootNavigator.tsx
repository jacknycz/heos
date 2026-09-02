import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MachinesStack } from "./MachinesStack";
import { DashboardScreen } from "../screens/DashboardScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

// Bottom-tab shell: Machines (passport + logging flows), Dashboard (manager view), Settings.
// Matches the Phase 1 screen inventory doc's top-level groups.
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Machines" component={MachinesStack} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
