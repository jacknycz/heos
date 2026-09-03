import { useState } from "react";
import { FlatList, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";
import { Screen, Text, Button, EmptyState } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "ChatThread">;
type Message = { id: string; role: "user" | "assistant"; content: string };

// Per-machine AI chat — opens already knowing this machine's context (Phase 1 scope).
export function ChatThreadScreen({ route }: Props) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function ensureThread() {
    if (threadId) return threadId;
    const thread = await apiPost<{ id: string }>("/chat/threads", { machineId: route.params.machineId });
    setThreadId(thread.id);
    return thread.id;
  }

  async function send() {
    if (!input.trim()) return;
    setSending(true);
    try {
      const id = await ensureThread();
      const newMessages = await apiPost<Message[]>(`/chat/threads/${id}/messages`, { role: "user", content: input });
      setMessages((prev) => [...prev, ...newMessages]);
      setInput("");
    } finally {
      setSending(false);
    }
  }

  async function addToRecord(messageId: string) {
    await apiPost(`/chat/messages/${messageId}/add-to-record`, {});
  }

  return (
    <Screen edges={["bottom"]}>
      <FlatList
        className="flex-1"
        data={messages}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<EmptyState title="Ask about this machine" subtitle="Its full history is already loaded into context." />}
        contentContainerClassName="gap-3"
        renderItem={({ item }) => (
          <View className={item.role === "user" ? "items-end" : "items-start"}>
            <View className={item.role === "user" ? "max-w-[85%] rounded-card bg-primary-600 px-3 py-2" : "max-w-[85%] rounded-card bg-neutral-100 px-3 py-2"}>
              <Text className={item.role === "user" ? "text-white" : "text-neutral-900"}>{item.content}</Text>
            </View>
            {item.role === "assistant" ? (
              <Button size="sm" variant="ghost" title="Add this update to the record" onPress={() => addToRecord(item.id)} />
            ) : null}
          </View>
        )}
      />
      <View className="flex-row items-center gap-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask something…"
          className="flex-1 rounded-card border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900"
          placeholderTextColor="#94a3b8"
        />
        <Button title="Send" onPress={send} loading={sending} />
      </View>
    </Screen>
  );
}
