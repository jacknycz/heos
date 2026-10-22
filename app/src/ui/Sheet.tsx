import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { neutral } from "../theme/palette";
import { hexToRgba } from "../theme/color";

const styles = StyleSheet.create({
  sheet: { height: "85%" },
  // Animated.View doesn't reliably take NativeWind's className (see Accordion.tsx — its animated
  // layers are all raw style too), so this is bg-black/40's equivalent as a literal style.
  backdrop: { backgroundColor: hexToRgba("#000000", 0.4) },
});

const TRANSITION_MS = 240;

// A slide-up panel over the current screen with a title row and a close button. Tapping the dark
// backdrop or the close button dismisses it. Children mount only while the sheet is open (or
// mid-close-animation — see `mounted` below), so each opening starts from a fresh form or
// reloaded conversation.
//
// The backdrop fades in place and the panel slides up — two separately animated layers, not one
// Modal-level `animationType="slide"` moving everything (backdrop included) as a single unit,
// which reads as the dark overlay sliding up non-cohesively with the panel instead of just
// being there. `mounted` lags one tick behind `visible` on close so the exit fade/slide actually
// gets to play before the Modal (and its children) disappear.
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  const { height: windowHeight } = useWindowDimensions();
  const [prevVisible, setPrevVisible] = useState(visible);

  // Adjusts `mounted` synchronously during render when `visible` changes, instead of in a
  // useEffect — React's own recommended pattern for "derive state from a changed prop" (a ref
  // would be simpler but isn't safe to read/write during render under concurrent rendering; a
  // second state value, updated conditionally, is the sanctioned way to do this comparison). It
  // avoids the extra render pass a useEffect setState call would otherwise cause here. True
  // either way: opening shows it; closing stays mounted until the exit animation below finishes
  // and explicitly unmounts it.
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setMounted(true);
  }

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: TRANSITION_MS }, (finished) => {
      if (finished && !visible) runOnJS(setMounted)(false);
    });
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  // windowHeight is comfortably more than the sheet's own 85%-of-screen height, so this clears
  // it fully off the bottom edge at progress 0 regardless of device size.
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * windowHeight }] }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={panelStyle}>
          <Pressable className="rounded-t-card bg-white p-4 pb-8 dark:bg-neutral-900" style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="heading">{title}</Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={neutral[500]} />
              </Pressable>
            </View>
            {mounted ? <View className="flex-1">{children}</View> : null}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
