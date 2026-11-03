// One-off seed for a realistic Daly Organics demo org — run against whichever DATABASE_URL is in
// scope (local .env, or `railway run` against staging) so the client has a populated fleet to look
// at in TestFlight instead of an empty first-run app. Safe to re-run: aborts instead of duplicating
// if an org named ORG_NAME already exists — delete it manually first if you want a clean reseed.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { hashPassword } from "../src/lib/auth";

// Demo-only credential, not a real secret — every seeded user shares it so it's easy to hand to
// the client. Tell them this on handoff; it's not meant to be memorable/secure beyond that.
const DEMO_PASSWORD = "DalyDemo2026!";

// Every title-level name (org, locations) gets this suffix so the fake login is unmistakable
// wherever it shows up in the app — never just "Daly Organics" with nothing marking it as test data.
const TEST_SUFFIX = " TEST";
const ORG_NAME = `Daly Organics${TEST_SUFFIX}`;

type Role = "ADMIN" | "MANAGER" | "MECHANIC" | "DRIVER";

const LOCATIONS = [
  { name: `Main Yard (HQ)${TEST_SUFFIX}`, address: "4100 Harvest Rd, Salinas, CA" },
  { name: `North Field Depot${TEST_SUFFIX}`, address: "892 Prunedale Rd, Prunedale, CA" },
  { name: `South Ranch Yard${TEST_SUFFIX}`, address: "2210 Old Stage Rd, Gonzales, CA" },
  { name: `Packing House Lot${TEST_SUFFIX}`, address: "77 Packer Ave, Salinas, CA" },
];

const USERS: { name: string; email: string; role: Role }[] = [
  { name: "Dana Daly", email: "dana@dalyorganics.test", role: "ADMIN" },
  { name: "Chris Daly", email: "chris@dalyorganics.test", role: "ADMIN" },
  { name: "Marisol Vega", email: "marisol.manager@dalyorganics.test", role: "MANAGER" },
  { name: "Pete Alvarado", email: "pete.manager@dalyorganics.test", role: "MANAGER" },
  { name: "Luis Ortega", email: "luis.mechanic@dalyorganics.test", role: "MECHANIC" },
  { name: "Hank Dubois", email: "hank.mechanic@dalyorganics.test", role: "MECHANIC" },
  { name: "Wes Tanaka", email: "wes.mechanic@dalyorganics.test", role: "MECHANIC" },
  { name: "Carlos Mendez", email: "carlos.driver@dalyorganics.test", role: "DRIVER" },
  { name: "Robby Haas", email: "robby.driver@dalyorganics.test", role: "DRIVER" },
  { name: "Theo Griggs", email: "theo.driver@dalyorganics.test", role: "DRIVER" },
];

type EquipmentTemplate = {
  kind: string;
  make: string;
  model: string;
  trackingUnit: "hours" | "miles";
  registered: boolean; // road-going vehicles carry a registration number/expiry
};

const EQUIPMENT: EquipmentTemplate[] = [
  { kind: "Tractor", make: "John Deere", model: "8R 410", trackingUnit: "hours", registered: false },
  { kind: "Tractor", make: "Kubota", model: "M7-172", trackingUnit: "hours", registered: false },
  { kind: "Combine", make: "John Deere", model: "S780", trackingUnit: "hours", registered: false },
  { kind: "Skid Steer", make: "Bobcat", model: "S650", trackingUnit: "hours", registered: false },
  { kind: "Track Loader", make: "CAT", model: "299D3", trackingUnit: "hours", registered: false },
  { kind: "Wheel Loader", make: "CAT", model: "950M", trackingUnit: "hours", registered: false },
  { kind: "Excavator", make: "Komatsu", model: "PC210", trackingUnit: "hours", registered: false },
  { kind: "Excavator", make: "CAT", model: "320", trackingUnit: "hours", registered: false },
  { kind: "Articulated Truck", make: "Volvo", model: "A40G", trackingUnit: "hours", registered: false },
  { kind: "Flatbed Truck", make: "Ford", model: "F-750", trackingUnit: "miles", registered: true },
  { kind: "Water Truck", make: "International", model: "HX620", trackingUnit: "miles", registered: true },
  { kind: "Sprayer", make: "John Deere", model: "R4045", trackingUnit: "hours", registered: false },
  { kind: "Forklift", make: "Toyota", model: "8FGU25", trackingUnit: "hours", registered: false },
  { kind: "Utility Vehicle", make: "Polaris", model: "Ranger XP", trackingUnit: "hours", registered: false },
  { kind: "Grain Truck", make: "Peterbilt", model: "348", trackingUnit: "miles", registered: true },
  { kind: "Backhoe Loader", make: "CAT", model: "420", trackingUnit: "hours", registered: false },
  { kind: "Mini Excavator", make: "Kubota", model: "KX057-5", trackingUnit: "hours", registered: false },
  { kind: "Bulldozer", make: "Komatsu", model: "D65PX", trackingUnit: "hours", registered: false },
  { kind: "Telehandler", make: "JCB", model: "510-56", trackingUnit: "hours", registered: false },
  { kind: "Pickup Truck", make: "Chevrolet", model: "Silverado 2500HD", trackingUnit: "miles", registered: true },
];

const SERVICE_TEMPLATES = [
  { label: "Engine Oil & Filter Service", hoursInterval: 250 },
  { label: "Hydraulic Fluid Service", hoursInterval: 1000 },
  { label: "Major Service Inspection", hoursInterval: 2000 },
];

const REPAIR_DESCRIPTIONS = [
  "Replaced worn hydraulic hose on boom arm",
  "Diagnosed and fixed electrical short in cab wiring harness",
  "Swapped out cracked radiator, refilled coolant",
  "Rebuilt starter motor, tested under load",
  "Replaced alternator belt, inspected pulleys",
  "Fixed slow leak in rear tire, rebalanced",
  "Repaired exhaust manifold crack",
  "Replaced fuel injector, cleaned fuel lines",
  "Serviced AC compressor, recharged system",
  "Tightened and re-torqued track tensioners",
];

const DRIVER_NOTE_TEXTS = [
  "Grinding noise when shifting into reverse",
  "Check engine light came on during morning route",
  "Steering feels looser than usual on tight turns",
  "Brake pedal softer than normal, worth a look",
  "Minor dent on left fender from gate clearance, cosmetic only",
  "Running hot on long hauls, keep an eye on coolant",
];

const REPEATED_PART_NUMBERS = [
  { partNumber: "OF-1180", description: "Oil Filter", costCents: 1899 },
  { partNumber: "AF-2200", description: "Air Filter", costCents: 2450 },
  { partNumber: "HH-500", description: "Hydraulic Hose 1/2in", costCents: 6200 },
  { partNumber: "BP-7742", description: "Brake Pad Set", costCents: 8900 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  const [existing] = await db.select().from(schema.organizations).where(eq(schema.organizations.name, ORG_NAME));
  if (existing) {
    console.error(`An organization named "${ORG_NAME}" already exists — delete it first if you want a clean reseed.`);
    process.exit(1);
  }

  const [organization] = await db.insert(schema.organizations).values({ name: ORG_NAME }).returning();
  console.log(`Created organization ${organization.id}`);

  const locationRows = await db
    .insert(schema.locations)
    .values(LOCATIONS.map((l) => ({ organizationId: organization.id, name: l.name, address: l.address })))
    .returning();

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const userRows = await db
    .insert(schema.users)
    .values(
      USERS.map((u) => ({
        organizationId: organization.id,
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      })),
    )
    .returning();
  const mechanics = userRows.filter((u) => u.role === "MECHANIC");
  const drivers = userRows.filter((u) => u.role === "DRIVER");

  const machineRows = [];
  for (let i = 0; i < 60; i++) {
    const template = EQUIPMENT[i % EQUIPMENT.length];
    const fleetNumber = `DO-${String(i + 1).padStart(3, "0")}`;
    const location = locationRows[i % locationRows.length];
    const year = randomInt(2012, 2024);
    const [machine] = await db
      .insert(schema.machines)
      .values({
        organizationId: organization.id,
        name: `${template.kind} ${fleetNumber.slice(3)}`,
        make: template.make,
        model: template.model,
        year,
        serialOrVin: `${template.make.slice(0, 2).toUpperCase()}${randomInt(100000, 999999)}`,
        engineNumber: template.registered ? `ENG-${randomInt(10000, 99999)}` : null,
        fleetNumber,
        registrationNumber: template.registered ? `CA-${randomInt(100000, 999999)}` : null,
        registrationExpiresAt: template.registered
          ? (Math.random() < 0.8 ? daysAgo(-randomInt(30, 400)) : daysAgo(randomInt(1, 90))).toISOString().slice(0, 10)
          : null,
        locationId: location.id,
        trackingUnit: template.trackingUnit,
      })
      .returning();
    machineRows.push({ ...machine, template });
  }
  console.log(`Created ${machineRows.length} machines across ${locationRows.length} locations`);

  // Current meter reading per machine — milestones/dashboard alerts are evaluated against this.
  for (const machine of machineRows) {
    const enteredBy = pick([...mechanics, ...drivers]);
    const isHours = machine.trackingUnit === "hours";
    await db.insert(schema.hoursEntries).values({
      machineId: machine.id,
      enteredById: enteredBy.id,
      hours: isHours ? randomInt(150, 6500) : null,
      distance: isHours ? null : randomInt(4000, 130000),
      recordedAt: daysAgo(randomInt(0, 10)),
    });
  }
  const currentValues = new Map<string, number>();
  for (const machine of machineRows) {
    const [latest] = await db
      .select({ hours: schema.hoursEntries.hours, distance: schema.hoursEntries.distance })
      .from(schema.hoursEntries)
      .where(eq(schema.hoursEntries.machineId, machine.id));
    currentValues.set(machine.id, (machine.trackingUnit === "hours" ? latest.hours : latest.distance) ?? 0);
  }

  // Maintenance milestones: deliberately spread across overdue / upcoming / healthy so the
  // dashboard's alert counts aren't empty or all-one-state for the demo.
  let milestoneCount = 0;
  for (const machine of machineRows) {
    const template = pick(SERVICE_TEMPLATES);
    const current = currentValues.get(machine.id) ?? 0;
    const bucket = Math.random();
    // overdue: lastCompletedAtValue far enough back that current has already passed the next
    // due point. upcoming: just inside the 10% warning window. healthy: plenty of margin left.
    let lastCompletedAtValue: number;
    if (bucket < 0.2) {
      lastCompletedAtValue = Math.max(0, current - template.hoursInterval - randomInt(10, 200));
    } else if (bucket < 0.4) {
      lastCompletedAtValue = current - template.hoursInterval + randomInt(1, template.hoursInterval * 0.1);
    } else {
      lastCompletedAtValue = current - randomInt(0, template.hoursInterval * 0.5);
    }
    await db.insert(schema.milestones).values({
      machineId: machine.id,
      label: template.label,
      type: "recurring",
      thresholdValue: template.hoursInterval,
      lastCompletedAtValue: Math.max(0, lastCompletedAtValue),
      lastCompletedAt: daysAgo(randomInt(10, 200)),
    });
    milestoneCount++;
  }
  console.log(`Created ${milestoneCount} milestones`);

  // A handful of repair logs, driver notes, and parts (some sharing part numbers across machines
  // on purpose, to light up the "repeat orders flagged" dashboard section).
  const repairLogIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const machine = pick(machineRows);
    const mechanic = pick(mechanics);
    const [log] = await db
      .insert(schema.repairLogs)
      .values({
        machineId: machine.id,
        mechanicId: mechanic.id,
        description: pick(REPAIR_DESCRIPTIONS),
        costCents: randomInt(4000, 180000),
        createdAt: daysAgo(randomInt(1, 120)),
      })
      .returning();
    repairLogIds.push(log.id);
  }

  for (let i = 0; i < 10; i++) {
    const machine = pick(machineRows);
    const driver = pick(drivers);
    await db.insert(schema.driverNotes).values({
      machineId: machine.id,
      driverId: driver.id,
      text: pick(DRIVER_NOTE_TEXTS),
      resolved: Math.random() < 0.4,
      createdAt: daysAgo(randomInt(1, 60)),
    });
  }

  for (const repeated of REPEATED_PART_NUMBERS) {
    const useCount = randomInt(2, 4);
    const usedMachines = new Set<string>();
    for (let i = 0; i < useCount; i++) {
      const machine = pick(machineRows);
      usedMachines.add(machine.id);
      await db.insert(schema.parts).values({
        machineId: machine.id,
        repairLogId: Math.random() < 0.5 ? pick(repairLogIds) : null,
        partNumber: repeated.partNumber,
        description: repeated.description,
        costCents: repeated.costCents,
        orderedAt: daysAgo(randomInt(1, 90)),
        receivedAt: Math.random() < 0.7 ? daysAgo(randomInt(0, 80)) : null,
      });
    }
  }
  // A few one-off parts too, so not every part looks like a repeat order.
  for (let i = 0; i < 8; i++) {
    const machine = pick(machineRows);
    await db.insert(schema.parts).values({
      machineId: machine.id,
      partNumber: `MISC-${randomInt(1000, 9999)}`,
      description: "Miscellaneous replacement part",
      costCents: randomInt(1500, 40000),
      orderedAt: daysAgo(randomInt(1, 60)),
      receivedAt: Math.random() < 0.7 ? daysAgo(randomInt(0, 50)) : null,
    });
  }

  console.log("\nDone. Admin login for the client:");
  console.log(`  email:    ${USERS[0].email}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("(every seeded user shares that same password)");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
