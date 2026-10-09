import { useState } from "react";
import { Image, Modal, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Text } from "./Text";
import { white } from "../theme/palette";

// id present = already persisted on the server; absent = picked this session, not saved yet
// (only possible while creating a new part — there's nothing to attach an id to until it exists).
export type ReceiptItem = { id?: string; image: string };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.5, // keeps the base64 payload reasonable — this gets stored as a DB column, not a file
  base64: true,
};

function toDataUrl(asset: ImagePicker.ImagePickerAsset) {
  return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
}

// Attach one or more receipt photos — camera or existing photo library — to a part/cost entry.
// Each thumbnail carries its own delete badge (top-right) that asks for confirmation before
// removing it, since a receipt photo isn't something you want to lose to a stray tap.
export function ReceiptsField({
  items,
  onAdd,
  onRemove,
}: {
  items: ReceiptItem[];
  onAdd: (image: string) => void;
  onRemove: (item: ReceiptItem) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ReceiptItem | null>(null);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) onAdd(toDataUrl(result.assets[0]));
  }

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) onAdd(toDataUrl(result.assets[0]));
  }

  return (
    <View className="gap-1.5">
      <Text variant="label">Receipts (optional)</Text>

      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-3">
          {items.map((item, index) => (
            <View key={item.id ?? `pending-${index}`} className="relative">
              <Pressable onPress={() => setPreview(item.image)}>
                <Image source={{ uri: item.image }} className="size-16 rounded-card border border-neutral-300 dark:border-neutral-700" />
              </Pressable>
              <Pressable
                onPress={() => setPendingDelete(item)}
                hitSlop={8}
                className="absolute -right-2 -top-2 size-6 items-center justify-center rounded-full bg-danger-600"
              >
                <Ionicons name="close" size={14} color={white} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Button size="sm" variant="secondary" title="Take Photo" onPress={takePhoto} />
        <Button size="sm" variant="secondary" title="Choose Photo" onPress={choosePhoto} />
      </View>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview }} className="h-4/5 w-11/12" resizeMode="contain" /> : null}
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete this receipt?"
        message="This can't be undone."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onRemove(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </View>
  );
}
