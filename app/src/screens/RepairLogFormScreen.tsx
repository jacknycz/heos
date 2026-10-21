import { ScrollView } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPatch, apiPost } from "../api/client";
import { repairLogSchema, type RepairLogFormValues } from "../schemas/logs";
import { Screen, FormField, PriceField, Button, Text } from "../ui";

type RepairLog = { id: string; description: string; costCents: number };

// The repair-log form itself. Used both in the passport's sheet (new entries) and by the full-screen
// route below (editing an entry from History), so the form only lives in one place.
export function RepairLogForm({ machineId, repairLog, onDone }: { machineId: string; repairLog?: RepairLog; onDone: () => void }) {
  const { control, handleSubmit, formState, setError } = useForm<RepairLogFormValues>({
    resolver: zodResolver(repairLogSchema),
    defaultValues: {
      description: repairLog?.description ?? "",
      cost: repairLog ? (repairLog.costCents / 100).toFixed(2) : "",
    },
  });

  async function onSubmit(values: RepairLogFormValues) {
    try {
      const costCents = Math.round(parseFloat(values.cost || "0") * 100);
      if (repairLog) {
        await apiPatch(`/repair-logs/${repairLog.id}`, { description: values.description, costCents });
      } else {
        await apiPost("/repair-logs", { machineId, description: values.description, costCents });
      }
      onDone();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save repair log" });
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="description" label="What was done?" multiline numberOfLines={4} className="min-h-24" voice />
      <PriceField control={control} name="cost" label="Cost" />
      <Button title={repairLog ? "Save changes" : "Save"} onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
    </ScrollView>
  );
}

// Full-screen route, reached only when editing an existing entry from History.
type Props = NativeStackScreenProps<MachinesStackParamList, "RepairLogForm">;

export function RepairLogFormScreen({ route, navigation }: Props) {
  return (
    <Screen edges={["bottom"]}>
      <RepairLogForm {...route.params} onDone={() => navigation.goBack()} />
    </Screen>
  );
}
