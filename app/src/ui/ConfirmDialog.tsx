import { Modal, Pressable, View } from "react-native";
import { Button } from "./Button";
import { Text } from "./Text";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// A centered confirm/cancel dialog for destructive actions. Not React Native's Alert.alert —
// react-native-web only partially implements Alert, so it wouldn't reliably show anything on
// the web preview build. This renders the same way everywhere.
export function ConfirmDialog({ visible, title, message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 p-6" onPress={onCancel}>
        <Pressable className="w-full max-w-sm gap-3 rounded-card bg-white p-4 dark:bg-neutral-900" onPress={(e) => e.stopPropagation()}>
          <Text variant="heading">{title}</Text>
          {message ? <Text variant="muted">{message}</Text> : null}
          <View className="flex-row justify-end gap-2">
            <Button variant="secondary" size="sm" title="Cancel" onPress={onCancel} />
            <Button variant="danger" size="sm" title={confirmLabel} onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
