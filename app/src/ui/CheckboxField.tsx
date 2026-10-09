import { Pressable, View } from "react-native";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { Text } from "./Text";
import { white } from "../theme/palette";

export type CheckboxFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
};

// A react-hook-form-integrated checkbox — no native Switch/checkbox dependency, hand-rolled
// like the rest of this kit (Select, ReceiptsField) to keep every platform identical.
export function CheckboxField<T extends FieldValues>({ control, name, label, disabled }: CheckboxFieldProps<T>) {
  const { field } = useController({ control, name });
  const checked = !!field.value;

  return (
    <Pressable
      onPress={() => field.onChange(!checked)}
      disabled={disabled}
      className={clsx("flex-row items-center gap-2 py-1", disabled && "opacity-50")}
    >
      <View
        className={clsx(
          "h-5 w-5 items-center justify-center rounded border",
          checked ? "border-primary-600 bg-primary-600" : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900",
        )}
      >
        {checked ? <Ionicons name="checkmark" size={14} color={white} /> : null}
      </View>
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}
