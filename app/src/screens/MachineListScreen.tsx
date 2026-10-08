import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet } from "../api/client";
import { Screen, Text, EmptyState, SearchField, Dropdown } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachineList">;
type Machine = { id: string; name: string; make?: string; model?: string; location?: { id: string; name: string } | null };
type Location = { id: string; name: string };

export function MachineListScreen({ navigation }: Props) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Re-fetch on every focus so a machine just added via the "+" form shows up immediately —
  // a mount-only fetch doesn't see updates made by a form that navigates back here (same fix
  // as the passport screen).
  useFocusEffect(
    useCallback(() => {
      apiGet<Machine[]>("/machines").then(setMachines).catch(() => {});
      apiGet<Location[]>("/locations").then(setLocations).catch(() => {});
    }, []),
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

  return (
    <Screen edges={["bottom"]}>
      <View className="gap-2">
        <SearchField value={search} onChangeText={setSearch} placeholder="Search machines…" />
        <Dropdown label="Location" placeholder="All locations" value={locationFilter} onChange={setLocationFilter} options={locationOptions} />
      </View>
      <FlatList
        data={filteredMachines}
        keyExtractor={(m) => m.id}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-200" />}
        ListEmptyComponent={
          isFiltering ? (
            <EmptyState title="No machines match" subtitle="Try a different search or location." />
          ) : (
            <EmptyState title="No machines yet" subtitle="Tap + above to add your first machine." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            className="py-4 active:opacity-60"
            onPress={() => navigation.navigate("MachinePassport", { machineId: item.id })}
          >
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
