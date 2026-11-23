import { useEffect, useRef, useState } from "react";
import { ScrollView, TextInput, View, type ScrollViewInstance } from "react-native";
import clsx from "clsx";
import { apiGet, apiPost } from "../../api/client";
import { Text, Button, EmptyState, Tabs } from "../../ui";
import { useAuth } from "../../auth/AuthContext";
import { RepairLogForm } from "../RepairLogFormScreen";
import { DriverNoteForm } from "../DriverNoteFormScreen";
import { neutral } from "../../theme/palette";

type RecordKind = "repair" | "note";
type Message = { id: string; role: "user" | "assistant"; content: string; addedToRecord?: boolean };

const BUBBLE: Record<Message["role"], string> = {
  user: "bg-primary-600",
  assistant: "bg-neutral-100 dark:bg-neutral-800",
};
const BUBBLE_TEXT: Record<Message["role"], string> = {
  user: "text-white",
  assistant: "text-neutral-900 dark:text-neutral-50",
};

// Per-machine AI chat, already primed with this machine's context server-side. Resumes the
// machine's existing thread on mount instead of starting a fresh, empty one every time this
// tab is opened — the standalone screen this replaced kept threadId only in local state, so
// leaving and coming back silently lost the whole conversation.
export function ChatTab({ machineId, onSummarySaved, onRecordAdded }: { machineId: string; onSummarySaved: () => void; onRecordAdded: () => void }) {
  const { user } = useAuth();
  const canLogRepair = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "MECHANIC";
  // Set while an assistant answer is being turned into a repair log or driver note.
  const [recording, setRecording] = useState<{ messageId: string; kind: RecordKind } | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // react-native now exposes a dedicated instance type for refs, separate from the ScrollView
  // component type itself (the component is forwardRef-wrapped, not a class).
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    apiGet<{ id: string; messages: Message[] } | null>(`/chat/threads?machineId=${machineId}`)
      .then((existing) => {
        if (existing) {
          setThreadId(existing.id);
          setMessages(existing.messages);
        }
      })
      .catch(() => {});
  }, [machineId]);

  async function ensureThread() {
    if (threadId) return threadId;
    const thread = await apiPost<{ id: string }>("/chat/threads", { machineId });
    setThreadId(thread.id);
    return thread.id;
  }

  async function send() {
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    try {
      const id = await ensureThread();
      const newMessages = await apiPost<Message[]>(`/chat/threads/${id}/messages`, { role: "user", content: input });
      setMessages((prev) => [...prev, ...newMessages]);
      setInput("");
    } catch (err) {
      // Most likely cause locally: no OPENAI_API_KEY set, which the server 502s on (see README).
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  // Called once the repair/note form below has actually saved the entry: flags the message as
  // recorded (and keeps its as-is AI log), then returns to the conversation.
  async function finishRecording(messageId: string) {
    setRecording(null);
    onRecordAdded();
    try {
      const updated = await apiPost<Message>(`/chat/messages/${messageId}/add-to-record`, {});
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, addedToRecord: updated.addedToRecord } : m)));
    } catch {
      // The entry itself is saved; only the "Added to record" marker failed, so don't alarm anyone.
    }
  }

  async function saveSummary() {
    if (!threadId) return;
    setSummarizing(true);
    setError(null);
    try {
      await apiPost(`/chat/threads/${threadId}/summary`, {});
      onSummarySaved();
    } catch (err) {
      // Also surfaces the "nothing new since the last summary" case from the server as-is.
      setError(err instanceof Error ? err.message : "Could not save summary");
    } finally {
      setSummarizing(false);
    }
  }

  // "Add this update to the record": the answer becomes a real repair log or driver note, opened in
  // the same form used elsewhere, pre-filled and editable before it's saved. Drivers can't log
  // repairs (the server enforces that too), so they only get the note option.
  if (recording) {
    const message = messages.find((m) => m.id === recording.messageId);
    return (
      <View className="flex-1 gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="heading">Add to record</Text>
          <Button size="sm" variant="ghost" title="Back to chat" onPress={() => setRecording(null)} />
        </View>
        {canLogRepair ? (
          <Tabs
            tabs={[
              { key: "repair", label: "Repair" },
              { key: "note", label: "Driver Note" },
            ]}
            activeKey={recording.kind}
            onChange={(key) => setRecording({ ...recording, kind: key as RecordKind })}
          />
        ) : null}
        {recording.kind === "repair" ? (
          <RepairLogForm machineId={machineId} initialText={message?.content} onDone={() => finishRecording(recording.messageId)} />
        ) : (
          <DriverNoteForm machineId={machineId} initialText={message?.content} onDone={() => finishRecording(recording.messageId)} />
        )}
      </View>
    );
  }

  // Only the message list scrolls; the summary button sits above it and the composer stays pinned
  // at the bottom, so the input is always in reach.
  return (
    <View className="flex-1 gap-3">
      {threadId && messages.length > 0 ? (
        <View className="flex-row justify-end">
          <Button size="sm" variant="ghost" title="Save Summary" onPress={saveSummary} loading={summarizing} />
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-3"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        // The list shrinks when the keyboard opens (the Sheet makes room for it), so this keeps
        // the latest messages in view instead of leaving them hidden below the new bottom edge.
        onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <EmptyState title="Ask about this machine" subtitle="Its full history is already loaded into context." />
        ) : (
          messages.map((item) => (
            <View key={item.id} className={item.role === "user" ? "items-end" : "items-start"}>
              <View className={clsx("max-w-[85%] rounded-card px-3 py-2", BUBBLE[item.role])}>
                <Text className={BUBBLE_TEXT[item.role]}>{item.content}</Text>
              </View>
              {item.role === "assistant" ? (
                item.addedToRecord ? (
                  <Text variant="muted" className="text-xs">
                    Added to record
                  </Text>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Add this update to the record"
                    onPress={() => setRecording({ messageId: item.id, kind: canLogRepair ? "repair" : "note" })}
                  />
                )
              ) : null}
            </View>
          ))
        )}
        {error ? <Text className="text-danger-600">{error}</Text> : null}
      </ScrollView>

      <View className="flex-row items-center gap-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask something…"
          className="flex-1 rounded-card border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          placeholderTextColor={neutral[400]}
        />
        <Button title="Send" onPress={send} loading={sending} />
      </View>
    </View>
  );
}
