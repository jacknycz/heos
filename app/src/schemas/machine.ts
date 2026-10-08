import { z } from "zod";
import type { SelectOption } from "../ui";

// Common heavy-equipment manufacturers, plus an escape hatch for anything else. Model stays free
// text for now — hooking every manufacturer up to its real model list is a later pass.
export const MANUFACTURER_OPTIONS: SelectOption[] = [
  { label: "Caterpillar", value: "Caterpillar" },
  { label: "John Deere", value: "John Deere" },
  { label: "Bobcat", value: "Bobcat" },
  { label: "Kubota", value: "Kubota" },
  { label: "Custom", value: "Custom" },
];

// A machine-level choice, not per-milestone — a machine only has one meter that matters
// (hour meter or odometer), and every milestone on it is measured against that same reading.
export const TRACKING_UNIT_OPTIONS: SelectOption[] = [
  { label: "Hours", value: "hours" },
  { label: "Miles", value: "miles" },
];

export const machineSchema = z
  .object({
    name: z.string().min(1, "Give this machine a name"),
    manufacturer: z.string().min(1, "Pick a manufacturer"),
    customManufacturer: z.string().optional(),
    model: z.string().optional(),
    year: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{4}$/.test(v), "Enter a 4-digit year"),
    serialOrVin: z.string().optional(),
    trackingUnit: z.enum(["hours", "miles"]),
    locationId: z.string().optional(),
    engineNumber: z.string().optional(),
    fleetNumber: z.string().optional(),
    registrationNumber: z.string().optional(),
    registrationExpiresAt: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD"),
  })
  .refine((data) => data.manufacturer !== "Custom" || (data.customManufacturer ?? "").trim().length > 0, {
    message: "Enter the manufacturer name",
    path: ["customManufacturer"],
  });

export type MachineFormValues = z.infer<typeof machineSchema>;
