import {
  roles,
  type Collection,
  type State,
  type Row,
} from '../../shared/domain'
export type Field = {
  key: string
  label: string
  type?: string
  options?: { value: string; label: string }[]
  required?: boolean
  value?: any
}
const f = (
  key: string,
  label: string,
  type = 'text',
  required = true,
): Field => ({ key, label, type, required })
const select = (key: string, label: string, values: string[]): Field => ({
  ...f(key, label, 'select'),
  options: values.map((v) => ({ value: v, label: v })),
})
export const statuses: Partial<Record<Collection, string[]>> = {
  customers: [
    'New',
    'Contacted',
    'Survey Scheduled',
    'Survey Approved',
    'Quotation Sent',
    'Converted',
    'Lost',
  ],
  surveys: ['Scheduled', 'In Progress', 'Submitted', 'Approved', 'Rejected'],
  quotations: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
  orders: ['Confirmed', 'Reserved', 'Dispatched', 'Completed'],
  installations: [
    'Scheduled',
    'In Progress',
    'Completed',
    'Delayed',
    'Cancelled',
  ],
  tickets: [
    'Open',
    'Assigned',
    'In Progress',
    'Waiting for Parts',
    'Resolved',
    'Closed',
  ],
  serials: [
    'Available',
    'Reserved',
    'Dispatched',
    'Installed',
    'Under Repair',
    'Replaced',
  ],
}
export const technicians = [
  'Rohan Verma',
  'Aditya Rao',
  'Neha Kapoor',
  'Ishaan Gupta',
  'Kavya Menon',
  'Rahul Das',
  'Sneha Reddy',
  'Aravind Nair',
  'Pooja Shah',
  'Sanjay Rao',
  'Nitin Kumar',
  'Diya Patel',
  'Vivek Jain',
  'Anil Roy',
  'Tara Singh',
]
export const titles: Record<string, string> = {
  customers: 'Customers & Leads',
  surveys: 'Site Surveys',
  quotations: 'Quotations',
  orders: 'Orders',
  products: 'Inventory',
  installations: 'Installations',
  warranties: 'Warranty',
  tickets: 'Service Tickets',
  finance: 'Finance & Reports',
  assistant: 'AI Assistant',
  settings: 'Settings',
  dashboard: 'Dashboard',
  overview: 'Project Overview',
  packages: 'Solar packages',
  serials: 'Serial register',
  suppliers: 'Suppliers',
  movements: 'Stock movements',
  expenses: 'Project expenses',
  payments: 'Payments',
}
export function fields(k: string, s: State, row?: Row): Field[] {
  const choose = (
    key: string,
    label: string,
    rows: Row[],
    name = 'name',
  ): Field => ({
    ...f(key, label, 'select'),
    options: rows.map((r) => ({
      value: r.id,
      label: r[name] || r.number || r.id,
    })),
  })
  const customer = choose('customerId', 'Customer', s.customers)
  const product = choose('productId', 'Product', s.products)
  const supplier = choose('supplierId', 'Supplier', s.suppliers)
  const order = choose('orderId', 'Sales order', s.orders, 'number')
  const date = f('date', 'Date', 'date')
  const notes = f('notes', 'Notes', 'textarea', false)
  const map: Record<string, Field[]> = {
    customers: [
      f('name', 'Customer name'),
      f('phone', 'Phone number', 'tel'),
      f('email', 'Email', 'email', false),
      f('address', 'Address'),
      f('city', 'City'),
      select('connection', 'Electricity connection', [
        'Single Phase',
        'Three Phase',
      ]),
      f('bill', 'Monthly electricity bill (₹)', 'number'),
      f('capacity', 'Required capacity (kW)', 'number'),
      select('system', 'System preference', ['On-Grid', 'Off-Grid']),
      select('subsidy', 'Subsidy requirement', ['Required', 'Not required']),
      select('assigned', 'Sales executive', [
        'Aarav Singh',
        'Ananya Reddy',
        'Vikram Shah',
      ]),
      select('status', 'Lead status', statuses.customers!),
      f('requirements', 'Additional requirements', 'textarea', false),
    ],
    surveys: [
      customer,
      select('assigned', 'Survey technician', technicians),
      date,
      select('roof', 'Roof type', ['Concrete / RCC', 'Metal sheet', 'Tile']),
      f('area', 'Shadow-free roof area (m²)', 'number'),
      select('direction', 'Roof direction', ['South', 'North', 'East', 'West']),
      f('tilt', 'Roof tilt (degrees)', 'number'),
      f('cableDistance', 'Cable distance (metres)', 'number'),
      select('grid', 'Grid suitability', [
        'Suitable',
        'Not suitable',
        'Needs assessment',
      ]),
      f('capacity', 'Recommended capacity (kW)', 'number'),
      f('observations', 'Technical observations', 'textarea'),
      f('photos', 'Roof photographs', 'file', false),
    ],
    products: [
      f('name', 'Product name'),
      f('sku', 'Unique SKU'),
      select('category', 'Category', [
        'Solar panels',
        'Inverters',
        'Batteries',
        'Charge controllers',
        'Mounting structures',
        'Wiring and connectors',
        'Safety switches',
        'Earthing components',
        'Installation services',
      ]),
      f('price', 'Unit selling price (₹)', 'number'),
      f('cost', 'Purchase cost (₹)', 'number'),
      f('reorder', 'Low-stock threshold', 'number'),
      f('warrantyMonths', 'Warranty duration (months)', 'number'),
      select('serialized', 'Individual serial tracking', ['No', 'Yes']),
      select('system', 'System compatibility', ['On-Grid', 'Off-Grid', 'Both']),
    ],
    packages: [
      f('name', 'Package name'),
      f('capacity', 'Capacity (kW)', 'number'),
      select('system', 'System type', ['On-Grid', 'Off-Grid']),
      notes,
    ],
    suppliers: [
      f('name', 'Supplier name'),
      f('phone', 'Phone', 'tel'),
      f('email', 'Email', 'email'),
      f('address', 'Address'),
    ],
    tickets: [
      customer,
      choose(
        'serialId',
        'Installed equipment',
        s.serials.filter((r) => r.status === 'Installed'),
        'serial',
      ),
      f('description', 'Fault description', 'textarea'),
      f('faultCode', 'Fault code', 'text', false),
      select('priority', 'Priority', ['Low', 'Medium', 'High', 'Critical']),
      select('assigned', 'Service technician', technicians),
      f('parts', 'Parts charges if not covered (₹)', 'number'),
      f('labour', 'Labour charges if not covered (₹)', 'number'),
      notes,
    ],
    expenses: [
      { ...order, required: false },
      select('category', 'Expense category', [
        'Installation labour',
        'Transport',
        'Service',
        'Administration',
        'Other',
      ]),
      f('amount', 'Amount (₹)', 'number'),
      date,
      f('description', 'Description'),
    ],
    followups: [customer, date, f('notes', 'Follow-up notes', 'textarea')],
    settings: [
      f('name', 'Company name'),
      f('advance', 'Minimum advance (%)', 'number'),
      f('tax', 'Default quotation tax (%)', 'number'),
      f('knowledge', 'Approved service knowledge base', 'textarea'),
    ],
    quote: [
      choose(
        'surveyId',
        'Approved survey',
        s.surveys
          .filter((r) => r.status === 'Approved')
          .map((r) => ({
            ...r,
            name:
              s.customers.find((c) => c.id === r.customerId)?.name +
              ' • ' +
              r.capacity +
              ' kW',
          })),
      ),
      choose(
        'packageId',
        'Configured solar package',
        s.packages.filter((p) => p.components?.length),
      ),
      f('installationCharge', 'Installation charge (₹)', 'number'),
      f('tax', 'Tax (%)', 'number'),
      f('discount', 'Discount (₹)', 'number'),
      f('subsidy', 'Subsidy information (₹, not deducted)', 'number'),
      f('validUntil', 'Valid until', 'date'),
    ],
    payment: [
      order,
      f('amount', 'Payment amount (₹)', 'number'),
      date,
      select('method', 'Payment method', [
        'Bank transfer',
        'UPI',
        'Cash',
        'Cheque',
      ]),
      f('reference', 'Unique payment reference'),
    ],
    purchase: [
      product,
      supplier,
      f('quantity', 'Purchase quantity', 'number'),
      f('cost', 'Unit purchase cost (₹)', 'number'),
      date,
      select('paid', 'Supplier payment settled', ['Yes', 'No']),
      f(
        'serials',
        'Serial numbers (one per line for tracked products)',
        'textarea',
        false,
      ),
    ],
    schedule: [
      choose(
        'orderId',
        'Sales order',
        s.orders.filter(
          (o) =>
            o.status !== 'Completed' &&
            !s.installations.some(
              (i) => i.orderId === o.id && i.status !== 'Cancelled',
            ),
        ),
        'number',
      ),
      select('assigned', 'Installation crew lead', technicians),
      date,
      f('time', 'Start time', 'time'),
    ],
    dispatch: [
      f(
        'serials',
        'Reserved serial numbers (scan or enter one per line)',
        'textarea',
        false,
      ),
    ],
    complete: [
      f('checklist', 'Mounting, cabling, and connections checked', 'checkbox'),
      f('safety', 'Electrical and site safety checks passed', 'checkbox'),
      f('testing', 'Commissioning and testing completed', 'checkbox'),
      f('generation', 'Power generation verification results', 'textarea'),
      f('photos', 'Completion photographs', 'file'),
      f(
        'signature',
        'Customer acceptance signature (customer types full name)',
      ),
      f('observations', 'Site observations', 'textarea', false),
    ],
    warrantyCorrect: [
      f('start', 'Warranty start', 'date'),
      f('expiry', 'Warranty expiry', 'date'),
      f('reason', 'Reason for correction (audited)', 'textarea'),
    ],
    ticketStatus: [
      f('notes', 'Resolution / progress notes', 'textarea'),
      f(
        'confirmed',
        'Customer confirms the issue is resolved',
        'checkbox',
        false,
      ),
    ],
    teamRole: [
      f('userId', 'Invited account user ID'),
      select('role', 'Assigned role', roles),
    ],
    refund: [
      f('amount', 'Refund amount (₹)', 'number'),
      date,
      f('reference', 'Unique refund reference'),
      f('reason', 'Reason for refund', 'textarea'),
    ],
    delivery: [
      date,
      f('receivedBy', 'Received by (customer / representative)'),
    ],
    subsidy: [
      select('subsidyStatus', 'Subsidy paperwork status', [
        'Not requested',
        'Documents pending',
        'Submitted',
        'Approved',
        'Received',
        'Rejected',
      ]),
      f('subsidyReference', 'Application reference', 'text', false),
    ],
    supplierPayment: [
      f('amount', 'Supplier payment amount (₹)', 'number'),
      f('reference', 'Payment reference'),
    ],
    coverageException: [
      f('parts', 'Exception parts charge (₹)', 'number'),
      f('labour', 'Exception labour charge (₹)', 'number'),
      f('reason', 'Authorized coverage exception reason', 'textarea'),
    ],
    replaceEquipment: [
      f('serial', 'Available replacement serial (same product)'),
      f('reason', 'Replacement reason', 'textarea'),
    ],
    bom: [product, f('quantity', 'Component quantity', 'number')],
  }
  return (map[k] || []).map((x) => ({
    ...x,
    value:
      row?.[x.key] ??
      (x.type === 'number'
        ? 0
        : x.type === 'date'
          ? new Date().toISOString().slice(0, 10)
          : x.type === 'checkbox'
            ? false
            : x.options?.[0]?.value || ''),
  }))
}
