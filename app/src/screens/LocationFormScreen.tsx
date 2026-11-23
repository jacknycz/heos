import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../navigation/SettingsStack";
import { apiPatch, apiPost } from "../api/client";
import { locationSchema, type LocationFormValues } from "../schemas/location";
import { Screen, FormField, Button, Text } from "../ui";

type Props = NativeStackScreenProps<SettingsStackParamList, "LocationForm">;

export function LocationFormScreen({ route, navigation }: Props) {
  const { location } = route.params;
  const { control, handleSubmit, formState, setError } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: location?.name ?? "", address: location?.address ?? "" },
  });

  async function onSubmit(values: LocationFormValues) {
    try {
      const payload = { name: values.name, address: values.address || undefined };
      if (location) {
        await apiPatch(`/locations/${location.id}`, payload);
      } else {
        await apiPost("/locations", payload);
      }
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save location" });
    }
  }

  return (
    <Screen edges={["bottom"]} scroll>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="name" label="Name" placeholder="e.g. Main Yard" />
      <FormField control={control} name="address" label="Address (optional)" multiline numberOfLines={2} />
      <Button title={location ? "Save changes" : "Add Location"} onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
    </Screen>
  );
}
