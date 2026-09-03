import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";
import { repairLogSchema, type RepairLogFormValues } from "../schemas/logs";
import { Screen, FormField, Button, Text } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "RepairLogForm">;

export function RepairLogFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const { control, handleSubmit, formState, setError } = useForm<RepairLogFormValues>({
    resolver: zodResolver(repairLogSchema),
    defaultValues: { description: "", cost: "" },
  });

  async function onSubmit(values: RepairLogFormValues) {
    try {
      await apiPost("/repair-logs", {
        machineId,
        description: values.description,
        costCents: Math.round(parseFloat(values.cost || "0") * 100),
      });
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save repair log" });
    }
  }

  return (
    <Screen edges={["bottom"]}>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="description" label="What was done?" multiline numberOfLines={4} className="min-h-24" />
      <FormField control={control} name="cost" label="Cost ($)" keyboardType="decimal-pad" />
      <Button title="Save" onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting} />
    </Screen>
  );
}
