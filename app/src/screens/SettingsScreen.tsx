import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../navigation/SettingsStack";
import { useAuth } from "../auth/AuthContext";
import { usePersistedColorScheme, type AppColorScheme } from "../theme/colorScheme";
import { Screen, Text, Button, Badge, Card, Tabs } from "../ui";

type Props = NativeStackScreenProps<SettingsStackParamList, "SettingsHome">;

const THEME_TABS: { key: AppColorScheme; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { colorScheme, setColorScheme } = usePersistedColorScheme();

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
      <Card className="gap-2">
        <Text variant="label">Appearance</Text>
        <Tabs tabs={THEME_TABS} activeKey={colorScheme} onChange={(key) => setColorScheme(key as AppColorScheme)} />
      </Card>
      {user?.role === "ADMIN" ? <Button title="Manage Team" variant="secondary" onPress={() => navigation.navigate("Team")} /> : null}
      {user?.role === "ADMIN" ? <Button title="Manage Locations" variant="secondary" onPress={() => navigation.navigate("Locations")} /> : null}
      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}
