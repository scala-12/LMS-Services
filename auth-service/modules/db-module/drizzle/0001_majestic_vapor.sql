ALTER TABLE "credentials" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ALTER COLUMN "username" SET NOT NULL;