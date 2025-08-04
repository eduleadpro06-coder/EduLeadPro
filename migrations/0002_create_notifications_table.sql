-- Create notifications table
CREATE TABLE "notifications" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id"),
  "type" varchar(50) NOT NULL,
  "title" varchar(200) NOT NULL,
  "message" text NOT NULL,
  "priority" varchar(20) DEFAULT 'medium',
  "read" boolean DEFAULT false,
  "action_type" varchar(50),
  "action_id" varchar(100),
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for better performance
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at"); 