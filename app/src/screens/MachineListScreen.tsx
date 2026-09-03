import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet } from "../api/client";
import { Screen, Text, EmptyState } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachineList">;
type Machine = { id: string; name: string; make?: string; model?: string };

export function MachineListScreen({ navigation }: Props) {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    apiGet<Machine[]>("/machines").then(setMachines).catch(() => {});
  }, []);

  return (
    <Screen edges={["bottom"]}>
      <FlatList
        data={machines}
        keyExtractor={(m) => m.id}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-200" />}
        ListEmptyComponent={
          <EmptyState title="No machines yet" subtitle="Add one from the server, or wire up a create-machine form here." />
        }
        renderItem={({ item }) => (
          <Pressable
            className="py-4 active:opacity-60"
            onPress={() => navigation.navigate("MachinePassport", { machineId: item.id })}
          >
            <Text variant="heading">{item.name}</Text>
            <Text variant="muted">{[item.make, item.model].filter(Boolean).join(" ")}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
