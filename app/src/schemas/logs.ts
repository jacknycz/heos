import { z } from "zod";

// Numeric fields come in as raw TextInput strings and get parsed on submit.
export const repairLogSchema = z.object({
  description: z.string().min(1, "Describe what was done"),
  cost: z.string(),
});
export type RepairLogFormValues = z.infer<typeof repairLogSchema>;

export const driverNoteSchema = z.object({
  text: z.string().min(1, "Describe what happened"),
});
export type DriverNoteFormValues = z.infer<typeof driverNoteSchema>;

export const hoursEntrySchema = z.object({
  hours: z.string(),
  distance: z.string(),
});
export type HoursEntryFormValues = z.infer<typeof hoursEntrySchema>;

export const partSchema = z.object({
  partNumber: z.string().min(1, "Enter a part number"),
  description: z.string().optional(),
  cost: z.string(),
});
export type PartFormValues = z.infer<typeof partSchema>;
