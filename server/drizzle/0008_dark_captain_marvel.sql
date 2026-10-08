ALTER TABLE "chat_summaries" ALTER COLUMN "covered_through_message_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_summaries" DROP COLUMN "covered_through_at";