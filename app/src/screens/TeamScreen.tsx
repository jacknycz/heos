import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, View } from "react-native";
import { apiGet, apiPatch, apiPost } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../auth/AuthContext";
import { Screen, Text, Button, Badge, Card } from "../ui";

type Member = { id: string; name: string; email: string; role: Role };
const ROLES: Role[] = ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"];
const ROLE_TONE: Record<Role, "primary" | "success" | "warning" | "neutral"> = {
  ADMIN: "primary",
  MANAGER: "success",
  MECHANIC: "warning",
  DRIVER: "neutral",
};

// Admin-only: view teammates, change anyone's role (including another admin's), and mint invite codes.
export function TeamScreen() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<Member[]>("/users").then(setMembers).catch((err) => setError(err.message));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function changeRole(memberId: string, role: Role) {
    setError(null);
    try {
      await apiPatch(`/users/${memberId}/role`, { role });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change role");
    }
  }

  async function createInvite(role: Role) {
    setError(null);
    try {
      const invite = await apiPost<{ code: string }>("/users/invites", { role });
      setInviteCode(invite.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <Screen edges={["bottom"]}>
        <Text>Only an organization admin can manage the team.</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]} padded={false}>
      <FlatList
        contentContainerClassName="gap-3 p-4"
        data={members}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View className="mb-2 gap-3">
            <Text variant="title">Team</Text>
            {error ? <Text className="text-danger-600">{error}</Text> : null}
            <Text variant="heading">Invite a teammate</Text>
            <View className="flex-row flex-wrap gap-2">
              {ROLES.map((r) => (
                <Button key={r} size="sm" variant="secondary" title={`Invite ${r}`} onPress={() => createInvite(r)} />
              ))}
            </View>
            {inviteCode ? (
              <Card>
                <Text selectable variant="body">
                  Share this code: <Text className="font-semibold">{inviteCode}</Text> (expires in 7 days, single use)
                </Text>
              </Card>
            ) : null}
            <Text variant="heading" className="mt-2">Members</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text variant="heading">{item.name}{item.id === user.id ? " (you)" : ""}</Text>
              <Badge label={item.role} tone={ROLE_TONE[item.role]} />
            </View>
            <Text variant="muted">{item.email}</Text>
            <View className="flex-row flex-wrap gap-2">
              {ROLES.filter((r) => r !== item.role).map((r) => (
                <Button key={r} size="sm" variant="outline" title={`Make ${r}`} onPress={() => changeRole(item.id, r)} />
              ))}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
