import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
export const organizations = pgTable('organizations', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  sessionHash: text('session_hash').unique(),
  kind: text().notNull().default('demo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const customers = pgTable(
  'customers',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('customers_organization_idx').on(t.organizationId)],
)
export const surveys = pgTable(
  'surveys',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('surveys_organization_idx').on(t.organizationId)],
)
export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('products_organization_idx').on(t.organizationId)],
)
export const packages = pgTable(
  'packages',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('packages_organization_idx').on(t.organizationId)],
)
export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('suppliers_organization_idx').on(t.organizationId)],
)
export const serials = pgTable(
  'serials',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id),
    customerId: uuid('customer_id').references(() => customers.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('serials_organization_idx').on(t.organizationId)],
)
export const quotations = pgTable(
  'quotations',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    surveyId: uuid('survey_id').references(() => surveys.id),
    packageId: uuid('package_id').references(() => packages.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('quotations_organization_idx').on(t.organizationId)],
)
export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    quotationId: uuid('quotation_id').references(() => quotations.id),
    packageId: uuid('package_id').references(() => packages.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('orders_organization_idx').on(t.organizationId)],
)
export const payments = pgTable(
  'payments',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    orderId: uuid('order_id').references(() => orders.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('payments_organization_idx').on(t.organizationId)],
)
export const installations = pgTable(
  'installations',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    orderId: uuid('order_id').references(() => orders.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('installations_organization_idx').on(t.organizationId)],
)
export const warranties = pgTable(
  'warranties',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    productId: uuid('product_id').references(() => products.id),
    serialId: uuid('serial_id').references(() => serials.id),
    installationId: uuid('installation_id').references(() => installations.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('warranties_organization_idx').on(t.organizationId)],
)
export const tickets = pgTable(
  'tickets',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    serialId: uuid('serial_id').references(() => serials.id),
    installationId: uuid('installation_id').references(() => installations.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('tickets_organization_idx').on(t.organizationId)],
)
export const expenses = pgTable(
  'expenses',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('expenses_organization_idx').on(t.organizationId)],
)
export const followups = pgTable(
  'followups',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    serialId: uuid('serial_id').references(() => serials.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('followups_organization_idx').on(t.organizationId)],
)
export const movements = pgTable(
  'movements',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id),
    orderId: uuid('order_id').references(() => orders.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('movements_organization_idx').on(t.organizationId)],
)
export const audit = pgTable(
  'audit',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('audit_organization_idx').on(t.organizationId)],
)
export const settings = pgTable(
  'settings',
  {
    id: uuid().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('settings_organization_idx').on(t.organizationId)],
)

// Identity owns credentials. Profiles contain contact information only.
export const profiles = pgTable('profiles', {
  id: uuid().primaryKey(),
  email: text().notNull(),
  fullName: text('full_name').notNull(),
  companyName: text('company_name').notNull(),
  phone: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
