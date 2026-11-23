import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Card, Text } from "../../ui";
import { useAuth } from "../../auth/AuthContext";
import { apiGet } from "../../api/client";
import { neutral, white } from "../../theme/palette";

type Part = {
  id: string;
  partNumber: string;
  description?: string | null;
  costCents: number;
  orderedAt: string;
  receivedAt: string | null;
  // Ids only; the image itself is fetched when a receipt is opened (see openReceipt).
  receipts: { id: string }[];
};

// Every part/order tied to this machine, plus a running total — the concrete "what has this
// machine cost us" view.
export function PartsCostTab({
  parts,
  onAddPress,
  onEditPress,
  onMarkReceived,
}: {
  parts: Part[];
  onAddPress: () => void;
  onEditPress: (part: Part) => void;
  onMarkReceived: (part: Part) => void;
}) {
  const { user } = useAuth();
  // Mirrors the server (see server/src/routes/parts.ts): ordering/correcting parts is
  // mechanic-and-up work, not a driver action.
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "MECHANIC";
  // null = closed; open with image null = still loading; error set = couldn't load it.
  const [preview, setPreview] = useState<{ image: string | null; error?: string } | null>(null);

  async function openReceipt(partId: string, receiptId: string) {
    setPreview({ image: null });
    try {
      const receipt = await apiGet<{ image: string }>(`/parts/${partId}/receipts/${receiptId}`);
      setPreview((current) => (current ? { image: receipt.image } : current));
    } catch (err) {
      setPreview((current) => (current ? { image: null, error: err instanceof Error ? err.message : "Couldn't load this receipt" } : current));
    }
  }

  const total = parts.reduce((sum, p) => sum + p.costCents, 0);

  return (
    <View className="gap-3">
      {canManage ? (
        <View className="flex-row justify-end">
          <Button size="sm" title="Add New" onPress={onAddPress} />
        </View>
      ) : null}

      <Card className="flex-row items-center justify-between">
        <Text variant="heading">Total spend</Text>
        <Text variant="heading" className="text-primary-600">
          ${(total / 100).toFixed(2)}
        </Text>
      </Card>

      <Card className="gap-2">
        {parts.length === 0 ? (
          <Text variant="muted">Nothing logged yet.</Text>
        ) : (
          parts.map((p) => (
            <View key={p.id} className="flex-row items-center gap-3">
              <View className="flex-1 gap-1">
                <Text variant="body">{p.partNumber}</Text>
                {p.description ? <Text variant="muted">{p.description}</Text> : null}
                <Text variant="muted">{new Date(p.orderedAt).toLocaleDateString()}</Text>
                {p.receipts.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1">
                    {p.receipts.map((r, i) => (
                      <Pressable
                        key={r.id}
                        onPress={() => openReceipt(p.id, r.id)}
                        className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 active:opacity-60 dark:bg-neutral-800"
                      >
                        <Ionicons name="receipt-outline" size={14} color={neutral[500]} />
                        <Text variant="muted" className="text-xs">
                          Receipt {i + 1}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {p.receivedAt ? (
                  <Badge label="Received" tone="success" />
                ) : canManage ? (
                  <Pressable onPress={() => onMarkReceived(p)}>
                    <Badge label="Ordered · tap to mark received" tone="warning" />
                  </Pressable>
                ) : (
                  <Badge label="Ordered" tone="warning" />
                )}
              </View>
              <View className="items-end gap-1">
                <Text variant="body">${(p.costCents / 100).toFixed(2)}</Text>
                {canManage ? (
                  <Pressable onPress={() => onEditPress(p)}>
                    <Text className="font-semibold text-primary-600">Edit</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
      </Card>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={() => setPreview(null)}>
          {preview?.image ? (
            <Image source={{ uri: preview.image }} className="h-4/5 w-11/12" resizeMode="contain" />
          ) : preview?.error ? (
            <Text className="text-white">{preview.error}</Text>
          ) : (
            <ActivityIndicator color={white} />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
