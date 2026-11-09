import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { Text } from "./Text";
import { VoiceInputButton } from "./VoiceInputButton";
import { neutral } from "../theme/palette";

export type FormFieldProps<T extends FieldValues> = Omit<TextInputProps, "value" | "onChangeText"> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  /** Overrides the label's default color — e.g. a field sitting on a colored (non-surface) background. */
  labelClassName?: string;
  /** Adds a mic button next to the label that transcribes a voice note into this field. */
  voice?: boolean;
  /** Masks the value like secureTextEntry, but adds an eye icon to reveal/hide it. Supersedes secureTextEntry. */
  secureToggle?: boolean;
};

// Every text input in the app should be this, not a bare TextInput — label placement,
// error display, and input styling all stay consistent, and validation comes from the
// zod schema passed to useForm's resolver instead of being hand-rolled per screen.
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  className,
  labelClassName,
  disabled,
  voice,
  secureToggle,
  secureTextEntry,
  ...inputProps
}: FormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const [revealed, setRevealed] = useState(false);

  return (
    <View className={clsx("gap-1.5", disabled && "opacity-50")}>
      <View className="flex-row items-center justify-between">
        <Text variant="label" className={labelClassName}>
          {label}
        </Text>
        {voice ? <VoiceInputButton onTranscript={(text) => field.onChange(field.value ? `${field.value} ${text}`.trim() : text)} /> : null}
      </View>
      <View className="relative justify-center">
        <TextInput
          value={typeof field.value === "string" ? field.value : (field.value ?? "")}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          editable={!disabled}
          placeholderTextColor={neutral[400]}
          secureTextEntry={secureToggle ? !revealed : secureTextEntry}
          className={clsx(
            "rounded-card border bg-white px-3 py-2.5 text-base text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50",
            fieldState.error ? "border-danger-500" : "border-neutral-300 dark:border-neutral-700",
            secureToggle && "pr-10",
            className,
          )}
          {...inputProps}
        />
        {secureToggle ? (
          <Pressable onPress={() => setRevealed((prev) => !prev)} hitSlop={8} className="absolute right-3">
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={neutral[500]} />
          </Pressable>
        ) : null}
      </View>
      {fieldState.error ? <Text className="text-sm text-danger-600">{fieldState.error.message}</Text> : null}
    </View>
  );
}
