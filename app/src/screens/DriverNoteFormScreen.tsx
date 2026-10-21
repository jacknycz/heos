import { ScrollView } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPatch, apiPost } from "../api/client";
import { driverNoteSchema, type DriverNoteFormValues } from "../schemas/logs";
import { Screen, FormField, Button, Text } from "../ui";

type DriverNote = { id: string; text: string };

// The driver-note form itself. Used both in the passport's sheet (new notes) and by the full-screen
// route below (editing a note from History).
export function DriverNoteForm({ machineId, driverNote, onDone }: { machineId: string; driverNote?: DriverNote; onDone: () => void }) {
  const { control, handleSubmit, formState, setError } = useForm<DriverNoteFormValues>({
    resolver: zodResolver(driverNoteSchema),
    defaultValues: { text: driverNote?.text ?? "" },
  });

  async function onSubmit(values: DriverNoteFormValues) {
    try {
      if (driverNote) {
        await apiPatch(`/driver-notes/${driverNote.id}`, { text: values.text });
      } else {
        await apiPost("/driver-notes", { machineId, text: values.text });
      }
      onDone();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save note" });
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="text" label="What happened?" multiline numberOfLines={4} className="min-h-24" voice />
      <Button title={driverNote ? "Save changes" : "Submit"} onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
    </ScrollView>
  );
}

// Full-screen route, reached only when editing an existing note from History.
type Props = NativeStackScreenProps<MachinesStackParamList, "DriverNoteForm">;

export function DriverNoteFormScreen({ route, navigation }: Props) {
  return (
    <Screen edges={["bottom"]}>
      <DriverNoteForm {...route.params} onDone={() => navigation.goBack()} />
    </Screen>
  );
}
