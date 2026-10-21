import { ScrollView } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPost } from "../api/client";
import { hoursEntrySchema, type HoursEntryFormValues } from "../schemas/logs";
import { FormField, Button, Text } from "../ui";

// Logs a new hours/distance reading in the passport's sheet.
export function HoursEntryForm({ machineId, onDone }: { machineId: string; onDone: () => void }) {
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
      onDone();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save entry" });
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="hours" label="Hours" keyboardType="decimal-pad" />
      <FormField control={control} name="distance" label="Distance" keyboardType="decimal-pad" />
      <Button title="Save" onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
    </ScrollView>
  );
}
