import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../navigation/SettingsStack";
import { useAuth } from "../auth/AuthContext";
import { Screen, Text, Button, Badge, Card } from "../ui";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <Screen edges={["bottom"]}>
      <Text variant="title">Settings</Text>
      <Card className="gap-2">
        <Text variant="heading">{user?.name}</Text>
        <Text variant="muted">{user?.email}</Text>
        <View className="flex-row items-center gap-2">
          <Text variant="body">{user?.organizationName ?? "Organization"}</Text>
          {user?.role ? <Badge label={user.role} tone="primary" /> : null}
        </View>
      </Card>
      {user?.role === "ADMIN" ? <Button title="Manage Team" variant="secondary" onPress={() => navigation.navigate("Team")} /> : null}
      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}
