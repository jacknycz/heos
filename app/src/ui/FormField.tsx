import { TextInput, View, type TextInputProps } from "react-native";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
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
};

// Every text input in the app should be this, not a bare TextInput — label placement,
// error display, and input styling all stay consistent, and validation comes from the
// zod schema passed to useForm's resolver instead of being hand-rolled per screen.
export function FormField<T extends FieldValues>({ control, name, label, className, labelClassName, disabled, voice, ...inputProps }: FormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <View className={clsx("gap-1.5", disabled && "opacity-50")}>
      <View className="flex-row items-center justify-between">
        <Text variant="label" className={labelClassName}>{label}</Text>
        {voice ? (
          <VoiceInputButton
            onTranscript={(text) => field.onChange(field.value ? `${field.value} ${text}`.trim() : text)}
          />
        ) : null}
      </View>
      <TextInput
        value={typeof field.value === "string" ? field.value : (field.value ?? "")}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        editable={!disabled}
        placeholderTextColor={neutral[400]}
        className={clsx(
          "rounded-card border bg-white px-3 py-2.5 text-base text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50",
          fieldState.error ? "border-danger-500" : "border-neutral-300 dark:border-neutral-700",
          className,
        )}
        {...inputProps}
      />
      {fieldState.error ? <Text className="text-sm text-danger-600">{fieldState.error.message}</Text> : null}
    </View>
  );
}
