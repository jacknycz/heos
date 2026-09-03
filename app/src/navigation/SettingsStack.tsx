import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TeamScreen } from "../screens/TeamScreen";

export type SettingsStackParamList = {
  Settings: undefined;
  Team: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} options={{ title: "Team" }} />
    </Stack.Navigator>
  );
}
