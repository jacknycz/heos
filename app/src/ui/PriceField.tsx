import { TextInput, View } from "react-native";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import clsx from "clsx";
import { Text } from "./Text";
import { neutral } from "../theme/palette";

export type PriceFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

// Strips anything that isn't a digit or decimal point, keeps only the first decimal point,
// and caps the fraction at two digits — so the value typed can always parse to real cents,
// instead of a plain text field that merely hints at a numeric keyboard.
function sanitizePriceInput(text: string) {
  let cleaned = text.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  const [whole, decimal] = cleaned.split(".");
  return decimal !== undefined ? `${whole}.${decimal.slice(0, 2)}` : cleaned;
}

// A currency input — a $ affix inside the field, digits-and-one-decimal-point only, capped at
// cents. Every cost field in the app should be this instead of a plain FormField with
// keyboardType="decimal-pad" (that only changes which on-screen keyboard shows on native; a
// physical or web keyboard could still type letters into it).
export function PriceField<T extends FieldValues>({ control, name, label }: PriceFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <View
        className={clsx(
          "flex-row items-center rounded-card border bg-white px-3 dark:bg-neutral-900",
          fieldState.error ? "border-danger-500" : "border-neutral-300 dark:border-neutral-700",
        )}
      >
        <Text className="text-base text-neutral-500 dark:text-neutral-400">$</Text>
        <TextInput
          value={typeof field.value === "string" ? field.value : (field.value ?? "")}
          onChangeText={(text) => field.onChange(sanitizePriceInput(text))}
          onBlur={field.onBlur}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={neutral[400]}
          className="flex-1 py-2.5 pl-1 text-base text-neutral-900 dark:text-neutral-50"
        />
      </View>
      {fieldState.error ? <Text className="text-sm text-danger-600">{fieldState.error.message}</Text> : null}
    </View>
  );
}
