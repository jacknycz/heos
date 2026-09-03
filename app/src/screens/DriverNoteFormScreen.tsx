import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "DriverNoteForm">;

export function DriverNoteFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const [text, setText] = useState("");

  async function submit() {
    await apiPost("/driver-notes", { machineId, text });
    navigation.goBack();
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>What happened?</Text>
      <TextInput value={text} onChangeText={setText} multiline style={{ borderWidth: 1, padding: 8, minHeight: 80 }} />
      <Button title="Submit" onPress={submit} />
    </View>
  );
}
