import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TeamScreen } from "../screens/TeamScreen";
import { LocationsScreen } from "../screens/LocationsScreen";
import { LocationFormScreen } from "../screens/LocationFormScreen";
import { useHeaderTheme } from "./useHeaderTheme";
import { DefaultBackButton } from "./DefaultBackButton";
import { HeaderIconButton } from "./HeaderIconButton";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Team: undefined;
  Locations: undefined;
  // location present means "editing that location" — absent means "creating a new one".
  LocationForm: { location?: { id: string; name: string; address?: string | null } };
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  const header = useHeaderTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: header.background },
        headerTintColor: header.text,
        headerTitleStyle: { color: header.text },
        headerLeft: DefaultBackButton,
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} options={{ title: "Team" }} />
      <Stack.Screen
        name="Locations"
        component={LocationsScreen}
        options={({ navigation }) => ({
          title: "Locations",
          headerRight: () => (
            <HeaderIconButton icon="add" accessibilityLabel="Add location" onPress={() => navigation.navigate("LocationForm", {})} />
          ),
        })}
      />
      <Stack.Screen
        name="LocationForm"
        component={LocationFormScreen}
        options={({ route }) => ({
          title: route.params.location ? "Edit Location" : "New Location",
        })}
      />
    </Stack.Navigator>
  );
}
