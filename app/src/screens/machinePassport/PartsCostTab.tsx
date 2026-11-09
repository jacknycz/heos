import { useState } from "react";
import { Image, Modal, Pressable, View } from "react-native";
import { Badge, Button, Card, Text } from "../../ui";
import { useAuth } from "../../auth/AuthContext";

type Part = {
  id: string;
  partNumber: string;
  description?: string | null;
  costCents: number;
  orderedAt: string;
  receivedAt: string | null;
  receipts: { id: string; image: string }[];
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
              {p.receipts.length > 0 ? (
                <View className="flex-row gap-1">
                  {p.receipts.slice(0, 3).map((r) => (
                    <Pressable key={r.id} onPress={() => setPreviewImage(r.image)}>
                      <Image source={{ uri: r.image }} className="size-10 rounded-card border border-neutral-300 dark:border-neutral-700" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View className="flex-1 gap-1">
                <Text variant="body">{p.partNumber}</Text>
                {p.description ? <Text variant="muted">{p.description}</Text> : null}
                <Text variant="muted">{new Date(p.orderedAt).toLocaleDateString()}</Text>
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

      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={() => setPreviewImage(null)}>
          {previewImage ? <Image source={{ uri: previewImage }} className="h-4/5 w-11/12" resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  );
}
