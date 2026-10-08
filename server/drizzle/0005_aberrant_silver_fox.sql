CREATE TABLE "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"machine_id" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"threshold_value" real NOT NULL,
	"last_completed_at_value" real,
	"last_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "machines" ADD COLUMN "tracking_unit" text DEFAULT 'hours' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "push_token" text;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;