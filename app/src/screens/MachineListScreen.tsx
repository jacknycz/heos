import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet } from "../api/client";
import { Screen, Text, EmptyState, SearchField, Dropdown } from "../ui";
import { neutral } from "../theme/palette";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachineList">;
type Machine = { id: string; name: string; make?: string; model?: string; location?: { id: string; name: string } | null };
type Location = { id: string; name: string };

export function MachineListScreen({ navigation }: Props) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  // Only the very first load shows a full-screen spinner — refocusing after adding a machine
  // re-fetches silently so the list doesn't flicker away while it reloads.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Re-fetch on every focus so a machine just added via the "+" form shows up immediately —
  // a mount-only fetch doesn't see updates made by a form that navigates back here (same fix
  // as the passport screen).
  const fetchAll = useCallback(() => {
    setError(false);
    Promise.all([apiGet<Machine[]>("/machines"), apiGet<Location[]>("/locations")])
      .then(([machineRows, locationRows]) => {
        setMachines(machineRows);
        setLocations(locationRows);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const filteredMachines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return machines.filter((m) => {
      if (locationFilter && m.location?.id !== locationFilter) return false;
      if (!query) return true;
      const haystack = [m.name, m.make, m.model, m.location?.name].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [machines, search, locationFilter]);

  const locationOptions = locations.map((l) => ({ label: l.name, value: l.id }));
  const isFiltering = search.trim().length > 0 || locationFilter.length > 0;

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        <View className="items-center py-12">
          <ActivityIndicator color={neutral[500]} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      <View className="gap-2">
        <SearchField value={search} onChangeText={setSearch} placeholder="Search machines…" />
        <Dropdown label="Location" placeholder="All locations" value={locationFilter} onChange={setLocationFilter} options={locationOptions} />
      </View>
      <FlatList
        className="flex-1"
        data={filteredMachines}
        keyExtractor={(m) => m.id}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-200" />}
        ListEmptyComponent={
          error ? (
            <EmptyState title="Couldn't load machines" subtitle="Check your connection and try again." onRetry={fetchAll} />
          ) : isFiltering ? (
            <EmptyState title="No machines match" subtitle="Try a different search or location." />
          ) : (
            <EmptyState title="No machines yet" subtitle="Tap + above to add your first machine." />
          )
        }
        renderItem={({ item }) => (
          <Pressable className="py-4 active:opacity-60" onPress={() => navigation.navigate("MachinePassport", { machineId: item.id })}>
            <Text variant="heading">{item.name}</Text>
            <Text variant="muted">
              {[item.make, item.model].filter(Boolean).join(" ")}
              {item.location ? ` • ${item.location.name}` : ""}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
