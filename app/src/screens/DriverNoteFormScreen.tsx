import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPost } from "../api/client";
import { driverNoteSchema, type DriverNoteFormValues } from "../schemas/logs";
import { Screen, FormField, Button, Text } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "DriverNoteForm">;

export function DriverNoteFormScreen({ route, navigation }: Props) {
  const { machineId } = route.params;
  const { control, handleSubmit, formState, setError } = useForm<DriverNoteFormValues>({
    resolver: zodResolver(driverNoteSchema),
    defaultValues: { text: "" },
  });

  async function onSubmit(values: DriverNoteFormValues) {
    try {
      await apiPost("/driver-notes", { machineId, text: values.text });
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save note" });
    }
  }

  return (
    <Screen edges={["bottom"]}>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="text" label="What happened?" multiline numberOfLines={4} className="min-h-24" />
      <Button title="Submit" onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting} />
    </Screen>
  );
}
