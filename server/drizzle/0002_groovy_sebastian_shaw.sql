CREATE TABLE "part_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"image" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "part_receipts" ADD CONSTRAINT "part_receipts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Preserve any existing single receiptImage as the first row in the new child table before
-- dropping the column, instead of silently discarding data already captured this session.
INSERT INTO "part_receipts" ("id", "part_id", "image", "created_at")
SELECT 'legacy_' || "id", "id", "receipt_image", "created_at" FROM "parts" WHERE "receipt_image" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "receipt_image";