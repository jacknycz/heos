import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { MachinesStack, type MachinesStackParamList } from "./MachinesStack";
import { SettingsStack } from "./SettingsStack";
import { DashboardScreen } from "../screens/DashboardScreen";
import { BottomNav } from "./BottomNav";

export type RootTabParamList = {
  Dashboard: undefined;
  Machines: NavigatorScreenParams<MachinesStackParamList>;
  Settings: undefined;
};

// Bottom-tab shell: Dashboard (manager view), Machines (passport + logging flows), Settings.
// Matches the Phase 1 screen inventory doc's top-level groups. Only shown once signed in — see App.tsx.
const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNav {...props} />}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <Tab.Screen name="Machines" component={MachinesStack} options={{ title: "Machines" }} />
      <Tab.Screen name="Settings" component={SettingsStack} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}
