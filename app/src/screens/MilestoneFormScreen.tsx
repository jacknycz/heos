import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiPatch, apiPost } from "../api/client";
import { createMilestoneSchema, MILESTONE_TYPE_OPTIONS, type MilestoneFormValues } from "../schemas/milestone";
import { Screen, FormField, SelectField, CheckboxField, Button, Text } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "MilestoneForm">;

export function MilestoneFormScreen({ route, navigation }: Props) {
  const { machineId, trackingUnit, currentTrackingValue, milestone } = route.params;
  const unitLabel = trackingUnit === "hours" ? "hrs" : "mi";

  const { control, handleSubmit, formState, setError, watch, setValue } = useForm<MilestoneFormValues>({
    resolver: zodResolver(createMilestoneSchema(currentTrackingValue, unitLabel)),
    defaultValues: {
      label: milestone?.label ?? "",
      type: milestone?.type ?? "recurring",
      thresholdValue: milestone?.thresholdValue?.toString() ?? "",
      startingNow: false,
      dueAt: "",
    },
  });

  const type = watch("type");
  const startingNow = watch("startingNow");
  const dueAt = watch("dueAt");

  // Mutually exclusive — both are ways of pinning the same "next due" value, so both being set
  // at once would mean silently picking a winner instead of showing what actually happens.
  // One-directional on purpose: "Due at" always wins and forces the checkbox off, but never the
  // other way around — checking the box never erases a value already typed into "Due at", so
  // unchecking it later (deciding not to reset after all) leaves it right there, ready to use.
  useEffect(() => {
    if (dueAt && startingNow) setValue("startingNow", false);
  }, [dueAt, startingNow, setValue]);

  async function onSubmit(values: MilestoneFormValues) {
    try {
      const enteredThreshold = parseFloat(values.thresholdValue);
      const dueAtValue = values.dueAt ? parseFloat(values.dueAt) : null;

      // Three ways to land on a due point, in priority order: an explicit "Due at" pins it
      // directly; "Starting now" anchors it to today's reading; otherwise it's a plain entry.
      let thresholdValue = enteredThreshold;
      let lastCompletedAtValue: number | undefined;

      if (dueAtValue != null) {
        if (values.type === "recurring") {
          lastCompletedAtValue = dueAtValue - enteredThreshold;
        } else {
          thresholdValue = dueAtValue;
        }
      } else if (!milestone && values.startingNow && currentTrackingValue != null) {
        // Create-time only — this is just a baseline, nothing was actually done yet.
        if (values.type === "recurring") {
          lastCompletedAtValue = currentTrackingValue;
        } else {
          thresholdValue = currentTrackingValue + enteredThreshold;
        }
      }

      if (milestone) {
        const payload: Record<string, unknown> = { label: values.label, type: values.type, thresholdValue };
        if (lastCompletedAtValue !== undefined) payload.lastCompletedAtValue = lastCompletedAtValue;
        // Edit-time "starting now" is a real completion ("we just did it") — resets the baseline
        // to today's reading server-side, same as Mark Done, bundled with any other edits here.
        if (dueAtValue == null && values.startingNow) payload.resetToCurrentValue = true;
        await apiPatch(`/milestones/${milestone.id}`, payload);
      } else {
        const payload: Record<string, unknown> = { machineId, label: values.label, type: values.type, thresholdValue };
        if (lastCompletedAtValue !== undefined) payload.lastCompletedAtValue = lastCompletedAtValue;
        await apiPost("/milestones", payload);
      }
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save milestone" });
    }
  }

  return (
    <Screen edges={["bottom"]}>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="label" label="What needs to happen?" placeholder="e.g. Fluids check" />
      <SelectField control={control} name="type" label="Type" options={MILESTONE_TYPE_OPTIONS} />
      <FormField
        control={control}
        name="thresholdValue"
        label={type === "recurring" ? `Every how many ${unitLabel}` : startingNow ? `How many ${unitLabel} from now` : `At how many ${unitLabel}`}
        keyboardType="decimal-pad"
        placeholder="e.g. 500"
      />
      <FormField
        control={control}
        name="dueAt"
        label={`Due at (optional)${currentTrackingValue != null ? ` — current: ${currentTrackingValue} ${unitLabel}` : ""}`}
        keyboardType="decimal-pad"
        placeholder={`e.g. 800 ${unitLabel}`}
        disabled={startingNow}
      />
      <Text variant="muted">Pins the exact next due reading directly, overriding the calculation above.</Text>
      {/* Only makes sense if there's a current reading to anchor to. Same checkbox, different
          meaning by context: creating sets a baseline (nothing done yet); editing an existing
          milestone means "we just did this" — a real completion, like Mark Done. Each field fades
          out while the other is active — mutually exclusive, shown as well as enforced. */}
      {currentTrackingValue != null ? (
        <CheckboxField
          control={control}
          name="startingNow"
          label={milestone ? `Just completed (reset to current ${unitLabel})` : `Starting now (use current ${unitLabel})`}
          disabled={!!dueAt}
        />
      ) : null}
      <Button title={milestone ? "Save changes" : "Add Milestone"} onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
    </Screen>
  );
}
