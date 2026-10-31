import { empty, make, type State } from './domain'
export function seed(): State {
  const s = empty()
  const dateAt = (d: number) => {
    const x = new Date()
    x.setDate(x.getDate() + d)
    return x.toISOString().slice(0, 10)
  }
  const names = [
    'Rajesh Sharma',
    'Priya Reddy',
    'Arjun Mehta',
    'Lakshmi Narayan',
    'Vikram Patel',
    'Ananya Iyer',
    'Suresh Kumar',
    'Meera Joshi',
    'Karthik Rao',
    'Divya Nair',
  ]
  names.forEach((name, i) =>
    s.customers.push(
      make({
        name,
        phone: `90000100${String(i).padStart(2, '0')}`,
        email: `demo.customer${i + 1}@example.com`,
        address: `${21 + i}, Green Park Colony`,
        city: ['Hyderabad', 'Secunderabad', 'Warangal'][i % 3],
        connection: 'Single Phase',
        bill: 2400 + i * 450,
        capacity: [3, 5, 2, 4, 3][i % 5],
        system: i % 3 === 0 ? 'Off-Grid' : 'On-Grid',
        subsidy: 'Required',
        requirements: 'Sample customer for demonstration',
        assigned: 'Aarav Singh',
        status: [
          'Converted',
          'Converted',
          'Converted',
          'Converted',
          'Converted',
          'Survey Scheduled',
          'Contacted',
          'New',
          'New',
          'New',
        ][i],
        createdAt: dateAt(-i * 2) + 'T09:00:00.000Z',
      }),
    ),
  )
  const catalog = [
    [
      'Mono PERC solar panel',
      'PAN-540',
      'Solar panels',
      14800,
      11200,
      46,
      8,
      240,
      false,
    ],
    [
      'Hybrid inverter 3 kW',
      'INV-3K',
      'Inverters',
      32500,
      25600,
      12,
      4,
      24,
      true,
    ],
    [
      'Lithium battery 100 Ah',
      'BAT-100',
      'Batteries',
      38000,
      31000,
      8,
      3,
      24,
      true,
    ],
    [
      'MPPT charge controller',
      'CC-40',
      'Charge controllers',
      8500,
      6300,
      3,
      4,
      24,
      true,
    ],
    [
      'Roof mounting kit',
      'MNT-R',
      'Mounting structures',
      6400,
      4200,
      22,
      6,
      60,
      false,
    ],
    [
      'Solar DC cable / metre',
      'CBL-DC',
      'Wiring and connectors',
      85,
      52,
      350,
      100,
      12,
      false,
    ],
    [
      'DC safety isolator',
      'SW-DC',
      'Safety switches',
      2400,
      1650,
      18,
      5,
      24,
      false,
    ],
    [
      'Earthing kit',
      'EAR-K',
      'Earthing components',
      3200,
      2100,
      3,
      5,
      24,
      false,
    ],
    [
      'Installation service',
      'SVC-IN',
      'Installation services',
      12000,
      0,
      999,
      0,
      0,
      false,
    ],
    ['Grid inverter 5 kW', 'INV-5K', 'Inverters', 46500, 37100, 2, 3, 24, true],
  ]
  catalog.forEach(
    ([
      name,
      sku,
      category,
      price,
      cost,
      stock,
      reorder,
      warrantyMonths,
      serialized,
    ]) =>
      s.products.push(
        make({
          name,
          sku,
          category,
          price,
          cost,
          stock,
          reorder,
          warrantyMonths,
          serialized,
          system: 'Both',
        }),
      ),
  )
  s.suppliers.push(
    make({
      name: 'Demo • Surya Solar Distributors',
      phone: '9000020000',
      email: 'demo.supplier@example.com',
      address: 'Hyderabad',
      outstanding: 0,
    }),
  )
  s.products
    .filter((p) => p.serialized)
    .forEach((p) => {
      for (let i = 0; i < Number(p.stock); i++)
        s.serials.push(
          make({
            productId: p.id,
            serial: `DEMO-${p.sku}-${String(i + 1).padStart(4, '0')}`,
            supplierId: s.suppliers[0].id,
            purchaseDate: dateAt(-25),
            cost: p.cost,
            status: 'Available',
          }),
        )
    })
  for (let capacity = 1; capacity <= 5; capacity++)
    for (const system of ['On-Grid', 'Off-Grid'])
      s.packages.push(
        make({
          name: `${capacity} kW ${system}`,
          capacity,
          system,
          components: [],
          notes:
            'Configure an engineer-approved bill of materials before quoting.',
        }),
      )
  // Explicit sample BOM for demonstration only; never a technical sizing recommendation.
  const pkg = s.packages.find(
    (p) => p.capacity === 3 && p.system === 'On-Grid',
  )!
  pkg.components = [
    { productId: s.products[0].id, quantity: 6 },
    { productId: s.products[1].id, quantity: 1 },
    { productId: s.products[4].id, quantity: 1 },
    { productId: s.products[6].id, quantity: 1 },
  ]
  pkg.notes =
    'Demonstration BOM only. An authorized engineer must approve quantities for real projects.'
  for (let i = 0; i < 5; i++) {
    const c = s.customers[i]
    const survey = make({
      customerId: c.id,
      assigned: ['Rohan Verma', 'Aditya Rao', 'Neha Kapoor'][i % 3],
      date: dateAt(-15 + i),
      roof: 'Concrete / RCC',
      area: 45,
      direction: 'South',
      tilt: 15,
      cableDistance: 20,
      grid: 'Suitable',
      capacity: c.capacity,
      observations: 'Sample technical survey',
      status: 'Approved',
    })
    s.surveys.push(survey)
    const items = pkg.components.map((x: any) => ({
      ...x,
      name: s.products.find((p) => p.id === x.productId)!.name,
      price: s.products.find((p) => p.id === x.productId)!.price,
      cost: s.products.find((p) => p.id === x.productId)!.cost,
    }))
    const subtotal = items.reduce(
      (n: number, x: any) => n + x.price * x.quantity,
      0,
    )
    const total = Math.round((subtotal + 12000) * 1.05)
    const q = make({
      number: `QUO-2026-${101 + i}`,
      customerId: c.id,
      surveyId: survey.id,
      packageId: pkg.id,
      items,
      installationCharge: 12000,
      tax: 5,
      discount: 0,
      subsidy: 78000,
      total,
      validUntil: dateAt(20),
      status: 'Accepted',
      createdAt: dateAt(-12 + i * 2) + 'T10:00:00.000Z',
    })
    s.quotations.push(q)
    const o = make({
      number: `SO-2026-${101 + i}`,
      customerId: c.id,
      quotationId: q.id,
      packageId: pkg.id,
      total,
      items,
      materialCost: items.reduce(
        (n: number, x: any) => n + x.cost * x.quantity,
        0,
      ),
      date: dateAt(i - 2),
      status: i < 2 ? 'Completed' : i === 2 ? 'Dispatched' : 'Confirmed',
      createdAt: dateAt(-12 + i * 2) + 'T10:00:00.000Z',
    })
    s.orders.push(o)
    s.payments.push(
      make({
        orderId: o.id,
        customerId: c.id,
        amount: i < 2 ? total : Math.round(total * 0.5),
        method: 'Bank transfer',
        date: dateAt(-10 + i * 2),
        reference: `DEMO-TXN-${101 + i}`,
      }),
    )
    const install = make({
      orderId: o.id,
      customerId: c.id,
      assigned: [
        'Rohan Verma',
        'Aditya Rao',
        'Neha Kapoor',
        'Rohan Verma',
        'Aditya Rao',
      ][i],
      date: dateAt(i - 2),
      time: '09:00',
      status: i < 2 ? 'Completed' : i === 2 ? 'In Progress' : 'Scheduled',
      safety: i < 2,
      testing: i < 2,
      checklist: i < 2,
      signature: i < 2 ? c.name : '',
      generation: i < 2 ? 'Verified (demo)' : '',
      finishedAt: i < 2 ? dateAt(i - 2) : null,
    })
    s.installations.push(install)
    if (i < 3) {
      for (const item of items) {
        const p = s.products.find((x) => x.id === item.productId)!
        p.stock -= item.quantity
        const serials = s.serials
          .filter((x) => x.productId === p.id && x.status === 'Available')
          .slice(0, item.quantity)
        serials.forEach((sn) => {
          sn.status = i < 2 ? 'Installed' : 'Dispatched'
          sn.orderId = o.id
          sn.customerId = c.id
          sn.installationId = install.id
          if (i < 2) {
            const end = new Date(dateAt(i - 2))
            end.setMonth(end.getMonth() + p.warrantyMonths)
            s.warranties.push(
              make({
                productId: p.id,
                serialId: sn.id,
                customerId: c.id,
                installationId: install.id,
                start: dateAt(i - 2),
                expiry: end.toISOString().slice(0, 10),
                status: 'Active',
              }),
            )
          }
        })
      }
    }
    s.expenses.push(
      make({
        orderId: o.id,
        category: 'Installation labour',
        amount: 3500 + i * 650,
        date: dateAt(-5 + i),
        description: 'Demo installation crew labour',
        supplierId: '',
      }),
    )
  }
  for (let i = 0; i < 5; i++)
    s.tickets.push(
      make({
        number: `TKT-${401 + i}`,
        customerId: s.customers[i % 2].id,
        serialId: s.warranties[i % 2]?.serialId,
        description: [
          'Inverter display error',
          'Generation lower than expected',
          'Monitoring app offline',
          'Battery health inspection',
          'Annual maintenance request',
        ][i],
        priority: ['High', 'Medium', 'Low', 'Medium', 'Low'][i],
        assigned: ['Aditya Rao', 'Neha Kapoor', 'Rohan Verma'][i % 3],
        status: [
          'Open',
          'Assigned',
          'In Progress',
          'Waiting for Parts',
          'Resolved',
        ][i],
        parts: 0,
        labour: 0,
        date: dateAt(-i),
        notes: 'Sample service ticket',
        confirmed: false,
      }),
    )
  s.settings.push(
    make({
      name: 'SunPower Solutions',
      advance: 40,
      tax: 5,
      organization: 'SunPower Solutions',
      knowledge:
        'Follow manufacturer documentation. Isolate power before inspection. Only qualified technicians may work on live electrical systems.',
    }),
  )
  return s
}
