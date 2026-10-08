import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { neutral } from "../theme/palette";

const styles = StyleSheet.create({
  sheet: { height: "85%" },
});

// A slide-up panel over the current screen with a title row and a close button. Tapping the dark
// backdrop or the close button dismisses it. Children mount only while the sheet is open, so each
// opening starts from a fresh form or reloaded conversation.
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-card bg-white p-4 pb-8 dark:bg-neutral-900"
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="heading">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={neutral[500]} />
            </Pressable>
          </View>
          {visible ? <View className="flex-1">{children}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
