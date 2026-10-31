// @vitest-environment node
// Regression specifications; execution is deferred to an environment that permits tests.
import { describe, it, expect } from 'vitest'
import { seed } from '../../shared/seed'
import {
  warrantyExpiry,
  metrics,
  visible,
  today,
  type State,
} from '../../shared/domain'
import { mutate } from '../../server/engine'
const admin = 'Admin / Director'
const run = (s: State, action: string, payload: any, role = admin) =>
  mutate(s, role, action, payload, 'Workflow verification')
function newOrder(s: State) {
  const customer = run(s, 'save', {
    collection: 'customers',
    data: {
      name: 'Demo Workflow Customer',
      phone: '9998887701',
      bill: 3200,
      capacity: 3,
      system: 'On-Grid',
      status: 'New',
    },
  })
  const survey = run(s, 'save', {
    collection: 'surveys',
    data: {
      customerId: customer.id,
      date: today(),
      assigned: 'Kavya Menon',
      area: 45,
      capacity: 3,
    },
  })
  run(s, 'surveyStatus', { id: survey.id, status: 'Submitted' })
  run(s, 'surveyStatus', { id: survey.id, status: 'Approved' })
  const quote = run(s, 'quote', {
    surveyId: survey.id,
    packageId: s.packages.find((p) => p.components.length)!.id,
    installationCharge: 12000,
    tax: 5,
    discount: 1000,
    subsidy: 78000,
    validUntil: today(),
  })
  run(s, 'quoteStatus', { id: quote.id, status: 'Sent' })
  const order = run(s, 'quoteStatus', { id: quote.id, status: 'Accepted' })
  return { customer, survey, quote, order }
}
describe('Connected solar workflow', () => {
  it('clamps warranty anniversaries to valid month-end dates', () => {
    expect(warrantyExpiry('2024-02-29', 24)).toBe('2026-02-28')
    expect(warrantyExpiry('2026-01-31', 1)).toBe('2026-02-28')
  })
  it('connects enquiry, approved survey, quote, payment, dispatch, installation, warranty, service and profitability', () => {
    const s = seed()
    const { customer, order } = newOrder(s)
    const revenueBefore = metrics(s).revenue
    run(s, 'payment', {
      orderId: order.id,
      amount: order.total * 0.5,
      date: today(),
      method: 'Bank transfer',
      reference: 'WORKFLOW-ADVANCE',
    })
    expect(metrics(s).revenue).toBe(revenueBefore)
    run(s, 'reserve', { id: order.id })
    const serials = s.serials
      .filter((sn) => sn.orderId === order.id)
      .map((sn) => sn.serial)
      .join('\n')
    run(s, 'dispatch', { id: order.id, serials })
    const installation = run(s, 'schedule', {
      orderId: order.id,
      date: today(),
      time: '11:00',
      assigned: 'Kavya Menon',
    })
    run(s, 'installStatus', { id: installation.id, status: 'In Progress' })
    run(s, 'complete', {
      id: installation.id,
      checklist: true,
      safety: true,
      testing: true,
      generation: 'Commissioned; output verified',
      photos: ['workspace/test-photo.jpg'],
      signature: customer.name,
    })
    expect(order.status).toBe('Completed')
    const equipment = s.serials.find(
      (sn) => sn.orderId === order.id && !sn.assetTag,
    )!
    const warranty = s.warranties.find((w) => w.serialId === equipment.id)!
    expect(warranty.start).toBe(today())
    expect(warranty.expiry > today()).toBe(true)
    const ticket = run(s, 'save', {
      collection: 'tickets',
      data: {
        customerId: customer.id,
        serialId: equipment.id,
        description: 'Demo inverter display check',
        priority: 'Low',
        assigned: 'Neha Kapoor',
        parts: 900,
        labour: 500,
      },
    })
    expect(ticket.parts + ticket.labour).toBe(0)
    run(s, 'ticketStatus', { id: ticket.id, status: 'Assigned' })
    run(s, 'ticketStatus', { id: ticket.id, status: 'In Progress' })
    run(s, 'ticketStatus', {
      id: ticket.id,
      status: 'Resolved',
      notes: 'Display verified; customer informed.',
    })
    expect(() =>
      run(s, 'ticketStatus', {
        id: ticket.id,
        status: 'Closed',
        confirmed: false,
      }),
    ).toThrow(/confirmation/)
    run(s, 'ticketStatus', {
      id: ticket.id,
      status: 'Closed',
      confirmed: true,
      notes: 'Customer confirmed.',
    })
    expect(ticket.status).toBe('Closed')
    expect(s.products.every((p) => p.stock >= 0)).toBe(true)
    run(s, 'save', {
      collection: 'expenses',
      data: {
        orderId: order.id,
        category: 'Installation labour',
        amount: 4200,
        date: today(),
        description: 'Crew labour',
      },
    })
    expect(order.total - order.materialCost - 4200).toBeGreaterThan(0)
  })
  it('rejects duplicate customer phones, serials, overpayments and wrong dispatch serials', () => {
    const s = seed()
    const { order } = newOrder(s)
    expect(() =>
      run(s, 'save', {
        collection: 'customers',
        data: {
          name: 'Duplicate',
          phone: s.customers[0].phone,
          bill: 100,
          capacity: 2,
        },
      }),
    ).toThrow(/already exists/)
    expect(() =>
      run(s, 'purchase', {
        productId: s.products.find((p) => p.serialized)!.id,
        supplierId: s.suppliers[0].id,
        quantity: 1,
        cost: 100,
        serials: s.serials[0].serial,
      }),
    ).toThrow(/already registered/)
    expect(() =>
      run(s, 'payment', {
        orderId: order.id,
        amount: order.total + 1,
        date: today(),
        reference: 'OVERPAY',
      }),
    ).toThrow(/exceeds/)
    run(s, 'reserve', { id: order.id })
    expect(() =>
      run(s, 'dispatch', { id: order.id, serials: 'wrong' }),
    ).toThrow(/advance/)
    run(s, 'payment', {
      orderId: order.id,
      amount: order.total,
      date: today(),
      reference: 'FULL',
      method: 'UPI',
    })
    expect(() =>
      run(s, 'dispatch', { id: order.id, serials: 'wrong' }),
    ).toThrow(/reserved serial/)
  })
  it('restricts financial data and warehouse mutations by role', () => {
    const s = seed()
    const { order } = newOrder(s)
    const sales = visible(s, 'Sales Executive')
    expect(sales.expenses).toHaveLength(0)
    expect(sales.products[0].cost).toBeUndefined()
    expect(sales.orders[0].items[0].cost).toBeUndefined()
    expect(() =>
      run(s, 'reserve', { id: order.id }, 'Installation Technician'),
    ).toThrow(/warehouse/)
    expect(() =>
      run(
        s,
        'warrantyCorrect',
        {
          id: s.warranties[0].id,
          start: today(),
          expiry: today(),
          reason: 'Not authorized',
        },
        'Service Technician',
      ),
    ).toThrow(/administrator/)
    expect(() =>
      run(
        s,
        'surveyStatus',
        { id: s.surveys[0].id, status: 'Approved' },
        'Sales Executive',
      ),
    ).toThrow(/technician/)
  })
  it('rejects stock shortages and missing completion requirements', () => {
    const s = seed()
    const { order } = newOrder(s)
    s.products.find((p) => p.id === order.items[0].productId)!.stock = 0
    expect(() => run(s, 'reserve', { id: order.id })).toThrow(
      /Insufficient stock/,
    )
    const active = s.installations.find((i) => i.status === 'In Progress')!
    expect(() =>
      run(s, 'complete', {
        id: active.id,
        safety: true,
        testing: true,
        checklist: true,
        signature: 'Demo customer',
        generation: 'Verified',
      }),
    ).toThrow(/upload a photo/)
  })
})
