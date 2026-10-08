import { z } from "zod";
import type { SelectOption } from "../ui";

export const MILESTONE_TYPE_OPTIONS: SelectOption[] = [
  { label: "Recurring", value: "recurring" },
  { label: "One-time", value: "one_time" },
];

// A factory, not a static schema, because "Due at" can't be less than the machine's current
// reading — a bound that depends on which machine's form this is, not something fixed up front.
export function createMilestoneSchema(currentTrackingValue: number | null, unitLabel: string) {
  return z.object({
    label: z.string().min(1, "Give this milestone a name"),
    type: z.enum(["recurring", "one_time"]),
    thresholdValue: z
      .string()
      .min(1, "Enter a number")
      .refine((v) => !Number.isNaN(parseFloat(v)) && parseFloat(v) > 0, "Enter a positive number"),
    startingNow: z.boolean(),
    dueAt: z
      .string()
      .optional()
      .refine((v) => !v || (!Number.isNaN(parseFloat(v)) && parseFloat(v) > 0), "Enter a positive number")
      .refine(
        (v) => !v || currentTrackingValue == null || parseFloat(v) >= currentTrackingValue,
        `Can't be less than the current reading (${currentTrackingValue} ${unitLabel})`,
      ),
  });
}
export type MilestoneFormValues = z.infer<ReturnType<typeof createMilestoneSchema>>;
