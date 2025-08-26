ALTER TABLE "guests" ADD COLUMN "cookie_id" text NOT NULL DEFAULT '';
ALTER TABLE "guests" ADD CONSTRAINT "guests_cookie_id_event_id_unique" UNIQUE("cookie_id","event_id");