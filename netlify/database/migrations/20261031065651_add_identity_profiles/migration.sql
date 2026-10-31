CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"company_name" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Profiles are accessible only through server code using the managed database role.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "profiles" FROM PUBLIC;
