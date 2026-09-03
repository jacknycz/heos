import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Button, FlatList, Text, View } from "react-native";
import { apiGet, apiPatch, apiPost } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../auth/AuthContext";

type Member = { id: string; name: string; email: string; role: Role };
const ROLES: Role[] = ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"];

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
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Only an organization admin can manage the team.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 16 }}
      data={members}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>Team</Text>
          {error ? <Text style={{ color: "crimson" }}>{error}</Text> : null}
          <Text style={{ fontWeight: "600" }}>Invite a teammate</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ROLES.map((r) => (
              <Button key={r} title={`Invite ${r}`} onPress={() => createInvite(r)} />
            ))}
          </View>
          {inviteCode ? <Text selectable>Share this code: {inviteCode} (expires in 7 days, single use)</Text> : null}
          <Text style={{ fontWeight: "600", marginTop: 8 }}>Members</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee", gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>{item.name}{item.id === user.id ? " (you)" : ""}</Text>
          <Text style={{ color: "#666" }}>{item.email}</Text>
          <Text>Role: {item.role}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ROLES.filter((r) => r !== item.role).map((r) => (
              <Button key={r} title={`Make ${r}`} onPress={() => changeRole(item.id, r)} />
            ))}
          </View>
        </View>
      )}
    />
  );
}
