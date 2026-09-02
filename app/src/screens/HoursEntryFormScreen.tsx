import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "HoursEntryForm">;

export function HoursEntryFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [hours, setHours] = useState("");
  const [distance, setDistance] = useState("");

  async function submit() {
    await apiPost("/hours-entries", {
      machineId,
      enteredById: "TODO-current-user-id",
      hours: hours ? parseFloat(hours) : undefined,
      distance: distance ? parseFloat(distance) : undefined,
    });
    navigation.goBack();
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>Hours</Text>
      <TextInput value={hours} onChangeText={setHours} keyboardType="decimal-pad" style={{ borderWidth: 1, padding: 8 }} />
      <Text>Distance</Text>
      <TextInput value={distance} onChangeText={setDistance} keyboardType="decimal-pad" style={{ borderWidth: 1, padding: 8 }} />
      <Button title="Save" onPress={submit} />
    </View>
  );
}
