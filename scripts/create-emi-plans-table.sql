CREATE TABLE IF NOT EXISTS "emi_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"plan_type" varchar(20) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"emi_period" integer NOT NULL,
	"emi_amount" numeric(10, 2) NOT NULL,
	"down_payment" numeric(10, 2) DEFAULT '0',
	"discount" numeric(10, 2) DEFAULT '0',
	"interest_rate" numeric(5, 2) DEFAULT '0',
	"start_date" date NOT NULL,
	"frequency" varchar(20) DEFAULT 'monthly',
	"processing_fee" numeric(10, 2) DEFAULT '0',
	"late_fee" numeric(10, 2) DEFAULT '0',
	"receipt_number" varchar(100),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
); 