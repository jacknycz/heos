import { useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";

type Props = NativeStackScreenProps<MachinesStackParamList, "ChatThread">;
type Message = { id: string; role: "user" | "assistant"; content: string };

// Per-machine AI chat — opens already knowing this machine's context (Phase 1 scope).
export function ChatThreadScreen({ route }: Props) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  async function ensureThread() {
    if (threadId) return threadId;
    const thread = await apiPost<{ id: string }>("/chat/threads", { machineId: route.params.machineId });
    setThreadId(thread.id);
    return thread.id;
  }

  async function send() {
    const id = await ensureThread();
    const newMessages = await apiPost<Message[]>(`/chat/threads/${id}/messages`, { role: "user", content: input });
    setMessages((prev) => [...prev, ...newMessages]);
    setInput("");
  }

  async function addToRecord(messageId: string) {
    await apiPost(`/chat/messages/${messageId}/add-to-record`, {});
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: item.role === "user" ? "600" : "400" }}>{item.content}</Text>
            <Button title="Add this update to the record" onPress={() => addToRecord(item.id)} />
          </View>
        )}
      />
      <TextInput value={input} onChangeText={setInput} placeholder="Ask something…" style={{ borderWidth: 1, padding: 8 }} />
      <Button title="Send" onPress={send} />
    </View>
  );
}
