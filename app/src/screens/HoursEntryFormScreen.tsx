import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";
import { hoursEntrySchema, type HoursEntryFormValues } from "../schemas/logs";
import { Screen, FormField, Button, Text } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "HoursEntryForm">;

export function HoursEntryFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const { control, handleSubmit, formState, setError } = useForm<HoursEntryFormValues>({
    resolver: zodResolver(hoursEntrySchema),
    defaultValues: { hours: "", distance: "" },
  });

  async function onSubmit(values: HoursEntryFormValues) {
    try {
      await apiPost("/hours-entries", {
        machineId,
        hours: values.hours ? parseFloat(values.hours) : undefined,
        distance: values.distance ? parseFloat(values.distance) : undefined,
      });
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save entry" });
    }
  }

  return (
    <Screen edges={["bottom"]}>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="hours" label="Hours" keyboardType="decimal-pad" />
      <FormField control={control} name="distance" label="Distance" keyboardType="decimal-pad" />
      <Button title="Save" onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting} />
    </Screen>
  );
}
