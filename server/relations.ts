export const relations: Record<string, Record<string, string>> = {
  surveys: { customer_id: 'customers' },
  serials: {
    product_id: 'products',
    customer_id: 'customers',
    supplier_id: 'suppliers',
  },
  quotations: {
    customer_id: 'customers',
    survey_id: 'surveys',
    package_id: 'packages',
  },
  orders: {
    customer_id: 'customers',
    quotation_id: 'quotations',
    package_id: 'packages',
  },
  payments: { customer_id: 'customers', order_id: 'orders' },
  installations: { customer_id: 'customers', order_id: 'orders' },
  warranties: {
    customer_id: 'customers',
    product_id: 'products',
    serial_id: 'serials',
    installation_id: 'installations',
  },
  tickets: {
    customer_id: 'customers',
    serial_id: 'serials',
    installation_id: 'installations',
  },
  expenses: { order_id: 'orders', supplier_id: 'suppliers' },
  followups: { customer_id: 'customers', serial_id: 'serials' },
  movements: {
    product_id: 'products',
    order_id: 'orders',
    supplier_id: 'suppliers',
  },
}
