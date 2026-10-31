export type Row = {
  id: string
  createdAt: string
  updatedAt: string
  [key: string]: any
}
export const collections = [
  'customers',
  'surveys',
  'products',
  'packages',
  'suppliers',
  'serials',
  'quotations',
  'orders',
  'payments',
  'installations',
  'warranties',
  'tickets',
  'expenses',
  'followups',
  'movements',
  'audit',
  'settings',
] as const
export type Collection = (typeof collections)[number]
export type State = Record<Collection, Row[]>
export const roles = [
  'Admin / Director',
  'Sales Executive',
  'Survey Technician',
  'Warehouse Manager',
  'Installation Technician',
  'Service Technician',
]
export const permissions: Record<string, string[]> = {
  'Admin / Director': [...collections],
  'Sales Executive': [
    'customers',
    'surveys',
    'quotations',
    'orders',
    'payments',
    'packages',
    'products',
    'followups',
  ],
  'Survey Technician': ['customers', 'surveys'],
  'Warehouse Manager': [
    'customers',
    'orders',
    'products',
    'packages',
    'suppliers',
    'serials',
    'movements',
  ],
  'Installation Technician': [
    'customers',
    'orders',
    'installations',
    'serials',
    'products',
  ],
  'Service Technician': [
    'customers',
    'products',
    'serials',
    'installations',
    'warranties',
    'tickets',
  ],
}
export const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0)
export const today = () => new Date().toISOString().slice(0, 10)
export function empty(): State {
  return Object.fromEntries(collections.map((k) => [k, []])) as State
}
export function make(data: Record<string, any>): Row {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  }
}
export function metrics(s: State) {
  const revenue = s.orders.reduce((n, r) => n + Number(r.total), 0)
  const materials = s.orders
    .filter((o) => ['Dispatched', 'Completed'].includes(o.status))
    .reduce((n, o) => n + Number(o.materialCost || 0), 0)
  const expenses =
    s.expenses.reduce((n, r) => n + Number(r.amount), 0) + materials
  const payments = s.payments.reduce(
    (n, r) => n + (r.type === 'Refund' ? -Number(r.amount) : Number(r.amount)),
    0,
  )
  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    payments,
    outstanding: revenue - payments,
    customers: s.customers.length,
    enquiries: s.customers.filter((c) => c.status === 'New').length,
    orders: s.orders.length,
    completed: s.installations.filter((i) => i.status === 'Completed').length,
    pending: s.installations.filter(
      (i) => !['Completed', 'Cancelled'].includes(i.status),
    ).length,
    low: s.products.filter((p) => Number(p.stock) <= Number(p.reorder)).length,
    open: s.tickets.filter((t) => t.status !== 'Closed').length,
  }
}
export function visible(s: State, role: string): State {
  const out = empty()
  for (const k of permissions[role] || [])
    out[k as Collection] = s[k as Collection].map((r) => {
      const c = { ...r }
      if (
        role !== 'Admin / Director' &&
        !['Warehouse Manager'].includes(role)
      ) {
        delete c.cost
        delete c.materialCost
        if (c.items)
          c.items = c.items.map((item: any) => {
            const { cost, ...safe } = item
            return safe
          })
      }
      return c
    })
  if (role !== 'Admin / Director')
    out.settings = s.settings.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      name: r.name,
      advance: r.advance,
      tax: r.tax,
      knowledge: r.knowledge,
    }))
  return out
}

export function warrantyExpiry(start: string, months: number) {
  const d = new Date(start + 'T00:00:00.000Z')
  const target = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1),
  )
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(d.getUTCDate(), last))
  return target.toISOString().slice(0, 10)
}
