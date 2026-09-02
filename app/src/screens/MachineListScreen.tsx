import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachineList">;
type Machine = { id: string; name: string; make?: string; model?: string };

export function MachineListScreen({ navigation }: Props) {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    apiGet<Machine[]>("/machines").then(setMachines).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={machines}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<Text>No machines yet — add one from the server, or wire up a create-machine form here.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}
            onPress={() => navigation.navigate("MachinePassport", { machineId: item.id })}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: "#666" }}>{[item.make, item.model].filter(Boolean).join(" ")}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
