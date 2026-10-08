import { TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { neutral } from "../theme/palette";

// A plain (non-form) search input for filter bars — FormField is react-hook-form-bound and
// doesn't fit a live list filter that has no submit step.
export function SearchField({
  value,
  onChangeText,
  placeholder = "Search…",
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-card border border-neutral-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
      <Ionicons name="search" size={18} color={neutral[400]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={neutral[400]}
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-base text-neutral-900 dark:text-neutral-50"
      />
    </View>
  );
}
