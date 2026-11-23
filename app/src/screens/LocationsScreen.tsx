import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../navigation/SettingsStack";
import { apiDelete, apiGet } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Screen, Text, Button, Card, EmptyState, ConfirmDialog } from "../ui";

type Location = { id: string; name: string; address?: string | null };
type Props = NativeStackScreenProps<SettingsStackParamList, "Locations">;

// Admin-only: view/add/edit/delete the organization's locations. Any authenticated user can
// still see the list elsewhere (the machine form's picker) — this screen is just the manage UI.
export function LocationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);

  const load = useCallback(() => {
    apiGet<Location[]>("/locations")
      .then(setLocations)
      .catch((err) => setError(err.message));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await apiDelete(`/locations/${pendingDelete.id}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete location");
    } finally {
      setPendingDelete(null);
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <Screen edges={["bottom"]}>
        <Text>Only an organization admin can manage locations.</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]} padded={false}>
      <FlatList
        className="flex-1"
        contentContainerClassName="gap-3 p-4"
        data={locations}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={error ? <Text className="mb-2 text-danger-600">{error}</Text> : undefined}
        ListEmptyComponent={<EmptyState title="No locations yet" subtitle="Tap + above to add your first location." />}
        renderItem={({ item }) => (
          <Card className="gap-2">
            <Pressable onPress={() => navigation.navigate("LocationForm", { location: item })}>
              <Text variant="heading">{item.name}</Text>
              {item.address ? <Text variant="muted">{item.address}</Text> : null}
            </Pressable>
            <View className="flex-row justify-end">
              <Button size="sm" variant="danger" title="Delete" onPress={() => setPendingDelete(item)} />
            </View>
          </Card>
        )}
      />
      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete location?"
        message={`"${pendingDelete?.name}" will be removed. Machines assigned to it will keep working but show no location.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}
