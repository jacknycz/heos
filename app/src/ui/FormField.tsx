import { TextInput, View, type TextInputProps } from "react-native";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import clsx from "clsx";
import { Text } from "./Text";

export type FormFieldProps<T extends FieldValues> = Omit<TextInputProps, "value" | "onChangeText"> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

// Every text input in the app should be this, not a bare TextInput — label placement,
// error display, and input styling all stay consistent, and validation comes from the
// zod schema passed to useForm's resolver instead of being hand-rolled per screen.
export function FormField<T extends FieldValues>({ control, name, label, className, ...inputProps }: FormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <TextInput
        value={typeof field.value === "string" ? field.value : (field.value ?? "")}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        placeholderTextColor="#94a3b8"
        className={clsx(
          "rounded-card border bg-white px-3 py-2.5 text-base text-neutral-900",
          fieldState.error ? "border-danger-500" : "border-neutral-300",
          className,
        )}
        {...inputProps}
      />
      {fieldState.error ? <Text className="text-sm text-danger-600">{fieldState.error.message}</Text> : null}
    </View>
  );
}
