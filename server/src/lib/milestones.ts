import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db";

export type MilestoneRow = typeof schema.milestones.$inferSelect;

export type MilestoneStatus = MilestoneRow & {
  // one_time: thresholdValue itself, or null once completed (nothing left to be due at).
  // recurring: lastCompletedAtValue (or 0) + thresholdValue — keeps advancing after each completion.
  nextDueAtValue: number | null;
  isDue: boolean;
  // Not due yet, but within the last UPCOMING_WINDOW_RATIO of its interval — the preventative
  // heads-up, as opposed to isDue's "already past it".
  isUpcoming: boolean;
  isComplete: boolean; // only ever true for a finished one_time milestone
};

// How close to a milestone's next-due point counts as "coming up" — the last 10% of its
// interval, e.g. a 500-hour recurring milestone starts warning 50 hours out.
const UPCOMING_WINDOW_RATIO = 0.1;

function isWithinUpcomingWindow(nextDueAtValue: number, currentValue: number | null, thresholdValue: number) {
  return currentValue !== null && nextDueAtValue - currentValue <= thresholdValue * UPCOMING_WINDOW_RATIO;
}

// The single source of truth for "is this milestone due" — used both when building a passport
// for display and when deciding whether a fresh hours/distance entry just crossed a threshold.
export function evaluateMilestone(milestone: MilestoneRow, currentValue: number | null): MilestoneStatus {
  if (milestone.type === "one_time") {
    const isComplete = milestone.lastCompletedAtValue !== null;
    const nextDueAtValue = isComplete ? null : milestone.thresholdValue;
    const isDue = !isComplete && currentValue !== null && currentValue >= milestone.thresholdValue;
    const isUpcoming =
      !isComplete && !isDue && nextDueAtValue !== null && isWithinUpcomingWindow(nextDueAtValue, currentValue, milestone.thresholdValue);
    return { ...milestone, nextDueAtValue, isDue, isUpcoming, isComplete };
  }
  const base = milestone.lastCompletedAtValue ?? 0;
  const nextDueAtValue = base + milestone.thresholdValue;
  const isDue = currentValue !== null && currentValue >= nextDueAtValue;
  const isUpcoming = !isDue && isWithinUpcomingWindow(nextDueAtValue, currentValue, milestone.thresholdValue);
  return { ...milestone, nextDueAtValue, isDue, isUpcoming, isComplete: false };
}

// Hours/distance entries are cumulative meter readings (like an odometer), not deltas, so the
// machine's "current value" for its tracked unit is just its most recent entry.
export async function getCurrentTrackingValue(machineId: string, trackingUnit: "hours" | "miles") {
  const [latest] = await db
    .select({ hours: schema.hoursEntries.hours, distance: schema.hoursEntries.distance })
    .from(schema.hoursEntries)
    .where(eq(schema.hoursEntries.machineId, machineId))
    .orderBy(desc(schema.hoursEntries.recordedAt))
    .limit(1);
  if (!latest) return null;
  return trackingUnit === "hours" ? latest.hours : latest.distance;
}
