import { Button, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../navigation/SettingsStack";
import { useAuth } from "../auth/AuthContext";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Settings</Text>
      <Text>{user?.name} — {user?.email}</Text>
      <Text style={{ color: "#666" }}>{user?.organizationName ?? "Organization"} · {user?.role}</Text>
      {user?.role === "ADMIN" ? <Button title="Manage Team" onPress={() => navigation.navigate("Team")} /> : null}
      <Button title="Log out" onPress={logout} color="crimson" />
    </View>
  );
}
