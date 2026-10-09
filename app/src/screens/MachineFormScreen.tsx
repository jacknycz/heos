import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiGet, apiPatch, apiPost } from "../api/client";
import { machineSchema, MANUFACTURER_OPTIONS, TRACKING_UNIT_OPTIONS, type MachineFormValues } from "../schemas/machine";
import { Screen, FormField, SelectField, Button, Text, type SelectOption } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "MachineForm">;

export function MachineFormScreen({ route, navigation }: Props) {
  const { machine } = route.params;
  // A machine's make might not be one of the fixed options (e.g. it was entered as "Custom"
  // originally) — in that case, the select should show "Custom" with the real value prefilled
  // into the custom-name field, not silently drop it.
  const isKnownManufacturer = machine ? MANUFACTURER_OPTIONS.some((o) => o.value === machine.make) : true;

  // No existing form fetches a list for a SelectField's options — every other one is static —
  // so this is populated from the API instead of a schemas/*.ts constant. "None" up front since
  // a location is optional.
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([{ label: "None", value: "" }]);
  useEffect(() => {
    apiGet<{ id: string; name: string }[]>("/locations")
      .then((rows) => setLocationOptions([{ label: "None", value: "" }, ...rows.map((l) => ({ label: l.name, value: l.id }))]))
      .catch(() => {});
  }, []);

  const { control, handleSubmit, formState, setError, watch } = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      name: machine?.name ?? "",
      manufacturer: machine ? (isKnownManufacturer ? (machine.make ?? "") : "Custom") : "",
      customManufacturer: machine && !isKnownManufacturer ? (machine.make ?? "") : "",
      model: machine?.model ?? "",
      year: machine?.year?.toString() ?? "",
      serialOrVin: machine?.serialOrVin ?? "",
      trackingUnit: machine?.trackingUnit ?? "hours",
      locationId: machine?.locationId ?? "",
      engineNumber: machine?.engineNumber ?? "",
      fleetNumber: machine?.fleetNumber ?? "",
      registrationNumber: machine?.registrationNumber ?? "",
      registrationExpiresAt: machine?.registrationExpiresAt ?? "",
    },
  });

  const manufacturer = watch("manufacturer");

  async function onSubmit(values: MachineFormValues) {
    try {
      const payload = {
        name: values.name,
        make: values.manufacturer === "Custom" ? values.customManufacturer!.trim() : values.manufacturer,
        model: values.model || undefined,
        year: values.year ? parseInt(values.year, 10) : undefined,
        serialOrVin: values.serialOrVin || undefined,
        trackingUnit: values.trackingUnit,
        // null, not undefined — this is the one field here that must support explicitly
        // clearing an already-assigned value, not just "leave unchanged" on PATCH.
        locationId: values.locationId || null,
        engineNumber: values.engineNumber || undefined,
        fleetNumber: values.fleetNumber || undefined,
        registrationNumber: values.registrationNumber || undefined,
        registrationExpiresAt: values.registrationExpiresAt || undefined,
      };
      if (machine) {
        await apiPatch(`/machines/${machine.id}`, payload);
      } else {
        await apiPost("/machines", payload);
      }
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save machine" });
    }
  }

  return (
    <Screen edges={["bottom"]} scroll>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="name" label="Name" placeholder="e.g. Loader 4" />
      <SelectField control={control} name="manufacturer" label="Manufacturer" options={MANUFACTURER_OPTIONS} />
      {manufacturer === "Custom" ? <FormField control={control} name="customManufacturer" label="Manufacturer name" /> : null}
      <FormField control={control} name="model" label="Model" placeholder="e.g. 950M" />
      <FormField control={control} name="year" label="Year" keyboardType="number-pad" placeholder="e.g. 2019" />
      <FormField control={control} name="serialOrVin" label="Serial / VIN" />
      <SelectField control={control} name="trackingUnit" label="Tracked in" options={TRACKING_UNIT_OPTIONS} />
      <SelectField control={control} name="locationId" label="Location" options={locationOptions} />
      <FormField control={control} name="engineNumber" label="Engine number" />
      <FormField control={control} name="fleetNumber" label="Fleet number" />
      <FormField control={control} name="registrationNumber" label="Registration #" />
      <FormField control={control} name="registrationExpiresAt" label="Registration expiration" placeholder="YYYY-MM-DD" />
      <Button title={machine ? "Save changes" : "Add Machine"} onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting} />
    </Screen>
  );
}
