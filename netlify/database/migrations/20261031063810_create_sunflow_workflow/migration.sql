CREATE TABLE "audit" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"order_id" uuid,
	"supplier_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "followups" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"serial_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installations" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"product_id" uuid,
	"order_id" uuid,
	"supplier_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"quotation_id" uuid,
	"package_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"session_hash" text UNIQUE,
	"kind" text DEFAULT 'demo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"survey_id" uuid,
	"package_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serials" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"product_id" uuid,
	"customer_id" uuid,
	"supplier_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"serial_id" uuid,
	"installation_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranties" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"product_id" uuid,
	"serial_id" uuid,
	"installation_id" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_organization_idx" ON "audit" ("organization_id");--> statement-breakpoint
CREATE INDEX "customers_organization_idx" ON "customers" ("organization_id");--> statement-breakpoint
CREATE INDEX "expenses_organization_idx" ON "expenses" ("organization_id");--> statement-breakpoint
CREATE INDEX "followups_organization_idx" ON "followups" ("organization_id");--> statement-breakpoint
CREATE INDEX "installations_organization_idx" ON "installations" ("organization_id");--> statement-breakpoint
CREATE INDEX "movements_organization_idx" ON "movements" ("organization_id");--> statement-breakpoint
CREATE INDEX "orders_organization_idx" ON "orders" ("organization_id");--> statement-breakpoint
CREATE INDEX "packages_organization_idx" ON "packages" ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_organization_idx" ON "payments" ("organization_id");--> statement-breakpoint
CREATE INDEX "products_organization_idx" ON "products" ("organization_id");--> statement-breakpoint
CREATE INDEX "quotations_organization_idx" ON "quotations" ("organization_id");--> statement-breakpoint
CREATE INDEX "serials_organization_idx" ON "serials" ("organization_id");--> statement-breakpoint
CREATE INDEX "settings_organization_idx" ON "settings" ("organization_id");--> statement-breakpoint
CREATE INDEX "suppliers_organization_idx" ON "suppliers" ("organization_id");--> statement-breakpoint
CREATE INDEX "surveys_organization_idx" ON "surveys" ("organization_id");--> statement-breakpoint
CREATE INDEX "tickets_organization_idx" ON "tickets" ("organization_id");--> statement-breakpoint
CREATE INDEX "warranties_organization_idx" ON "warranties" ("organization_id");--> statement-breakpoint
ALTER TABLE "audit" ADD CONSTRAINT "audit_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_serial_id_serials_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "serials"("id");--> statement-breakpoint
ALTER TABLE "installations" ADD CONSTRAINT "installations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "installations" ADD CONSTRAINT "installations_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "installations" ADD CONSTRAINT "installations_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_package_id_packages_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id");--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_survey_id_surveys_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_package_id_packages_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id");--> statement-breakpoint
ALTER TABLE "serials" ADD CONSTRAINT "serials_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "serials" ADD CONSTRAINT "serials_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "serials" ADD CONSTRAINT "serials_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "serials" ADD CONSTRAINT "serials_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_serial_id_serials_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "serials"("id");--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_installation_id_installations_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "installations"("id");--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_serial_id_serials_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "serials"("id");--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_installation_id_installations_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "installations"("id");
--> statement-breakpoint
CREATE UNIQUE INDEX customers_phone_unique ON customers (organization_id, (data->>'phone'));
--> statement-breakpoint
CREATE UNIQUE INDEX products_sku_unique ON products (organization_id, (data->>'sku'));
--> statement-breakpoint
CREATE UNIQUE INDEX serials_number_unique ON serials (organization_id, (data->>'serial'));
--> statement-breakpoint
CREATE UNIQUE INDEX payments_reference_unique ON payments (organization_id, (data->>'reference'));
--> statement-breakpoint
CREATE UNIQUE INDEX orders_quotation_unique ON orders (organization_id, quotation_id);
--> statement-breakpoint
CREATE UNIQUE INDEX warranty_serial_unique ON warranties (organization_id, serial_id);
--> statement-breakpoint
ALTER TABLE products ADD CONSTRAINT products_nonnegative_stock CHECK ((data->>'stock')::numeric >= 0);
--> statement-breakpoint
ALTER TABLE payments ADD CONSTRAINT payments_positive_amount CHECK ((data->>'amount')::numeric > 0);

--> statement-breakpoint
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY customers_organization_isolation ON customers USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY surveys_organization_isolation ON surveys USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY products_organization_isolation ON products USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY packages_organization_isolation ON packages USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY suppliers_organization_isolation ON suppliers USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE serials ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY serials_organization_isolation ON serials USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY quotations_organization_isolation ON quotations USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY orders_organization_isolation ON orders USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY payments_organization_isolation ON payments USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY installations_organization_isolation ON installations USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY warranties_organization_isolation ON warranties USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tickets_organization_isolation ON tickets USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY expenses_organization_isolation ON expenses USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY followups_organization_isolation ON followups USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY movements_organization_isolation ON movements USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY audit_organization_isolation ON audit USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY settings_organization_isolation ON settings USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

--> statement-breakpoint
CREATE INDEX surveys_customer_id_idx ON surveys (customer_id);

--> statement-breakpoint
CREATE INDEX serials_product_id_idx ON serials (product_id);

--> statement-breakpoint
CREATE INDEX serials_customer_id_idx ON serials (customer_id);

--> statement-breakpoint
CREATE INDEX serials_supplier_id_idx ON serials (supplier_id);

--> statement-breakpoint
CREATE INDEX quotations_customer_id_idx ON quotations (customer_id);

--> statement-breakpoint
CREATE INDEX quotations_survey_id_idx ON quotations (survey_id);

--> statement-breakpoint
CREATE INDEX quotations_package_id_idx ON quotations (package_id);

--> statement-breakpoint
CREATE INDEX orders_customer_id_idx ON orders (customer_id);

--> statement-breakpoint
CREATE INDEX orders_quotation_id_idx ON orders (quotation_id);

--> statement-breakpoint
CREATE INDEX orders_package_id_idx ON orders (package_id);

--> statement-breakpoint
CREATE INDEX payments_customer_id_idx ON payments (customer_id);

--> statement-breakpoint
CREATE INDEX payments_order_id_idx ON payments (order_id);

--> statement-breakpoint
CREATE INDEX installations_customer_id_idx ON installations (customer_id);

--> statement-breakpoint
CREATE INDEX installations_order_id_idx ON installations (order_id);

--> statement-breakpoint
CREATE INDEX warranties_customer_id_idx ON warranties (customer_id);

--> statement-breakpoint
CREATE INDEX warranties_product_id_idx ON warranties (product_id);

--> statement-breakpoint
CREATE INDEX warranties_serial_id_idx ON warranties (serial_id);

--> statement-breakpoint
CREATE INDEX warranties_installation_id_idx ON warranties (installation_id);

--> statement-breakpoint
CREATE INDEX tickets_customer_id_idx ON tickets (customer_id);

--> statement-breakpoint
CREATE INDEX tickets_serial_id_idx ON tickets (serial_id);

--> statement-breakpoint
CREATE INDEX tickets_installation_id_idx ON tickets (installation_id);

--> statement-breakpoint
CREATE INDEX expenses_order_id_idx ON expenses (order_id);

--> statement-breakpoint
CREATE INDEX expenses_supplier_id_idx ON expenses (supplier_id);

--> statement-breakpoint
CREATE INDEX followups_customer_id_idx ON followups (customer_id);

--> statement-breakpoint
CREATE INDEX followups_serial_id_idx ON followups (serial_id);

--> statement-breakpoint
CREATE INDEX movements_product_id_idx ON movements (product_id);

--> statement-breakpoint
CREATE INDEX movements_order_id_idx ON movements (order_id);

--> statement-breakpoint
CREATE INDEX movements_supplier_id_idx ON movements (supplier_id);
