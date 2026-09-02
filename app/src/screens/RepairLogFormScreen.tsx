import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "RepairLogForm">;

export function RepairLogFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");

  async function submit() {
    // TODO: replace hardcoded mechanicId with the logged-in user once auth is wired up.
    await apiPost("/repair-logs", {
      machineId,
      mechanicId: "TODO-current-user-id",
      description,
      costCents: Math.round(parseFloat(cost || "0") * 100),
    });
    navigation.goBack();
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>What was done?</Text>
      <TextInput value={description} onChangeText={setDescription} multiline style={{ borderWidth: 1, padding: 8, minHeight: 80 }} />
      <Text>Cost ($)</Text>
      <TextInput value={cost} onChangeText={setCost} keyboardType="decimal-pad" style={{ borderWidth: 1, padding: 8 }} />
      <Button title="Save" onPress={submit} />
    </View>
  );
}
