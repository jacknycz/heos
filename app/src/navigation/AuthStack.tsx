import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { CreateOrganizationScreen } from "../screens/auth/CreateOrganizationScreen";
import { AcceptInviteScreen } from "../screens/auth/AcceptInviteScreen";

export type AuthStackParamList = {
  Login: undefined;
  CreateOrganization: undefined;
  AcceptInvite: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} options={{ title: "Create Organization" }} />
      <Stack.Screen name="AcceptInvite" component={AcceptInviteScreen} options={{ title: "Join Organization" }} />
    </Stack.Navigator>
  );
}
