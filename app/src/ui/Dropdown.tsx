import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { primary, neutral } from "../theme/palette";

export type DropdownOption = { label: string; value: string };

// Same bottom-sheet visual language as SelectField, but plain value/onChange instead of
// react-hook-form-bound — for filter bars, which aren't form fields. Always includes an
// "All"-style option (placeholder) mapping to "".
export function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
}: {
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between gap-2 rounded-card border border-neutral-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <Text className={selected ? "text-base text-neutral-900 dark:text-neutral-50" : "text-base text-neutral-400"}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={neutral[400]} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="gap-1 rounded-t-card bg-white p-2 pb-6 dark:bg-neutral-900" onPress={(e) => e.stopPropagation()}>
            <Text variant="label" className="px-3 py-2">
              {label}
            </Text>
            <Pressable
              className="flex-row items-center justify-between rounded-card p-3 active:bg-neutral-100 dark:active:bg-neutral-800"
              onPress={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <Text variant="body">{placeholder}</Text>
              {value === "" ? <Ionicons name="checkmark" size={18} color={primary[600]} /> : null}
            </Pressable>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                className="flex-row items-center justify-between rounded-card p-3 active:bg-neutral-100 dark:active:bg-neutral-800"
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text variant="body">{opt.label}</Text>
                {opt.value === value ? <Ionicons name="checkmark" size={18} color={primary[600]} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
