import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { Text } from "./Text";
import { primary, neutral } from "../theme/palette";

export type SelectOption = { label: string; value: string };

export type SelectFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
};

// A react-hook-form-integrated picker matching FormField's look — no native <select>/Picker
// dependency, just a field that opens a bottom-sheet-style modal list. Keeps every platform
// (iOS/Android/web) rendering the exact same thing instead of each OS's native picker UI.
export function SelectField<T extends FieldValues>({ control, name, label, options, placeholder = "Select…" }: SelectFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === field.value);

  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={clsx(
          "flex-row items-center justify-between rounded-card border bg-white px-3 py-2.5 dark:bg-neutral-900",
          fieldState.error ? "border-danger-500" : "border-neutral-300 dark:border-neutral-700",
        )}
      >
        <Text className={selected ? "text-base text-neutral-900 dark:text-neutral-50" : "text-base text-neutral-400"}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={neutral[400]} />
      </Pressable>
      {fieldState.error ? <Text className="text-sm text-danger-600">{fieldState.error.message}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="gap-1 rounded-t-card bg-white p-2 pb-6 dark:bg-neutral-900" onPress={(e) => e.stopPropagation()}>
            <Text variant="label" className="px-3 py-2">
              {label}
            </Text>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                className="flex-row items-center justify-between rounded-card p-3 active:bg-neutral-100 dark:active:bg-neutral-800"
                onPress={() => {
                  field.onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text variant="body">{opt.label}</Text>
                {opt.value === field.value ? <Ionicons name="checkmark" size={18} color={primary[600]} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
