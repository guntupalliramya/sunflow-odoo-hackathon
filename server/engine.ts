import {
  make,
  warrantyExpiry,
  today,
  permissions,
  type State,
  type Collection,
} from '../shared/domain'
const assert = (v: any, m: string) => {
  if (!v) throw new Error(m)
}
const num = (v: any, min = 0) => {
  const n = Number(v)
  assert(Number.isFinite(n) && n >= min, 'Enter a valid non-negative number.')
  return n
}
const find = (s: State, k: Collection, id: string) => {
  const r = s[k].find((x) => x.id === id)
  assert(r, `${k} record not found.`)
  return r!
}
const add = (s: State, k: Collection, d: Record<string, any>) => {
  const r = make(d)
  s[k].push(r)
  return r
}
const can = (role: string, k: string) =>
  assert(
    permissions[role]?.includes(k),
    'Your role does not permit this action.',
  )
export function mutate(
  s: State,
  role: string,
  action: string,
  p: any,
  actor: string,
) {
  let result: any = null
  let auditBefore: any = null
  const admin = role === 'Admin / Director'
  const requireAdmin = () =>
    assert(admin, 'Only the administrator can perform this action.')
  if (action === 'save') {
    const k = p.collection as Collection
    assert(
      [
        'customers',
        'surveys',
        'products',
        'packages',
        'suppliers',
        'tickets',
        'expenses',
        'followups',
        'settings',
      ].includes(k),
      'Use the workflow action for this record.',
    )
    can(role, k)
    if (['products', 'packages', 'suppliers', 'settings'].includes(k))
      assert(
        admin || (role === 'Warehouse Manager' && k !== 'settings'),
        'Administrator or warehouse access required.',
      )
    const allowedFields: Record<string, string[]> = {
      customers: [
        'name',
        'phone',
        'email',
        'address',
        'city',
        'connection',
        'bill',
        'capacity',
        'system',
        'subsidy',
        'requirements',
        'assigned',
        'status',
      ],
      surveys: [
        'customerId',
        'assigned',
        'date',
        'roof',
        'area',
        'direction',
        'tilt',
        'cableDistance',
        'grid',
        'capacity',
        'observations',
        'photos',
      ],
      products: [
        'name',
        'sku',
        'category',
        'price',
        'cost',
        'reorder',
        'warrantyMonths',
        'serialized',
        'system',
      ],
      packages: ['name', 'capacity', 'system', 'notes'],
      suppliers: ['name', 'phone', 'email', 'address'],
      tickets: [
        'customerId',
        'serialId',
        'description',
        'faultCode',
        'priority',
        'assigned',
        'parts',
        'labour',
        'notes',
      ],
      expenses: ['orderId', 'category', 'amount', 'date', 'description'],
      followups: ['customerId', 'date', 'notes'],
      settings: ['name', 'advance', 'tax', 'knowledge'],
    }
    const d = Object.fromEntries(
      Object.entries(p.data || {}).filter(([key]) =>
        allowedFields[k]?.includes(key),
      ),
    )
    if (k === 'customers') {
      assert(String(d.name || '').trim(), 'Customer name is required.')
      d.phone = String(d.phone || '').replace(/\D/g, '')
      assert(/^\d{10,15}$/.test(d.phone), 'Phone must contain 10–15 digits.')
      assert(
        !s.customers.some((c) => c.phone === d.phone && c.id !== p.id),
        'An enquiry already exists for this phone number.',
      )
      d.bill = num(d.bill)
      d.capacity = num(d.capacity, 1)
      assert(d.capacity <= 5, 'Supported capacity is 1–5 kW.')
      assert(
        !d.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email),
        'Enter a valid email address.',
      )
    }
    if (k === 'surveys') {
      find(s, 'customers', d.customerId)
      assert(d.date && d.assigned, 'Survey date and technician are required.')
      d.area = num(d.area)
      d.capacity = num(d.capacity, 1)
      d.status = p.id ? find(s, k, p.id).status : 'Scheduled'
    }
    if (k === 'products') {
      assert(d.name && d.sku, 'Product name and SKU are required.')
      assert(
        !s.products.some((r) => r.sku === d.sku && r.id !== p.id),
        'SKU must be unique.',
      )
      d.price = num(d.price)
      d.cost = num(d.cost)
      d.warrantyMonths = num(d.warrantyMonths)
      d.reorder = num(d.reorder)
      d.serialized = d.serialized === true || d.serialized === 'Yes'
      assert(
        Number.isInteger(d.warrantyMonths),
        'Warranty duration must be whole months.',
      )
      d.stock = p.id ? find(s, k, p.id).stock : 0
    }
    if (k === 'packages') {
      d.capacity = num(d.capacity, 1)
      assert(d.capacity <= 5, 'Supported capacity is 1–5 kW.')
      d.components = p.id ? find(s, k, p.id).components : []
      assert(d.name, 'Package name required.')
    }
    if (k === 'tickets') {
      const c = find(s, 'customers', d.customerId)
      const sn = find(s, 'serials', d.serialId)
      assert(
        sn.customerId === c.id && sn.status === 'Installed',
        'Select installed equipment belonging to this customer.',
      )
      assert(d.description, 'Fault description is required.')
      const w = s.warranties.find(
        (w) =>
          w.serialId === sn.id &&
          w.status === 'Active' &&
          w.start <= today() &&
          w.expiry >= today(),
      )
      d.parts = w ? 0 : num(d.parts)
      d.labour = w ? 0 : num(d.labour)
      d.coverage = w ? 'Covered' : 'Not covered'
      d.status = p.id ? find(s, k, p.id).status : 'Open'
      d.number = p.id
        ? find(s, k, p.id).number
        : `TKT-${String(s.tickets.length + 401)}`
      d.confirmed = false
      d.installationId = sn.installationId
      d.date = today()
    }
    if (k === 'expenses') {
      d.amount = num(d.amount, 0.01)
      if (d.orderId) find(s, 'orders', d.orderId)
      assert(d.description, 'Expense description required.')
    }
    if (k === 'followups') {
      find(s, 'customers', d.customerId)
      assert(d.notes && d.date, 'Follow-up notes and date required.')
    }
    if (k === 'settings') {
      requireAdmin()
      d.advance = num(d.advance)
      assert(d.advance <= 100, 'Advance percentage must be 0–100.')
      d.tax = num(d.tax)
    }
    if (p.id) {
      const r = find(s, k, p.id)
      Object.assign(r, d, { updatedAt: new Date().toISOString() })
      result = r
    } else result = add(s, k, d)
    if (k === 'surveys') {
      const c = find(s, 'customers', d.customerId)
      c.status = 'Survey Scheduled'
    }
  } else if (action === 'surveyStatus') {
    can(role, 'surveys')
    assert(
      admin || role === 'Survey Technician',
      'Survey approval requires a survey technician or admin.',
    )
    const r = find(s, 'surveys', p.id)
    const paths: Record<string, string[]> = {
      Scheduled: ['In Progress', 'Submitted'],
      'In Progress': ['Submitted'],
      Submitted: ['Approved', 'Rejected'],
      Rejected: ['Scheduled'],
    }
    assert(
      paths[r.status]?.includes(p.status),
      'Invalid survey status transition.',
    )
    r.status = p.status
    if (p.status === 'Approved')
      find(s, 'customers', r.customerId).status = 'Survey Approved'
  } else if (action === 'bom') {
    requireAdmin()
    const r = find(s, 'packages', p.id)
    assert(
      Array.isArray(p.components),
      'Provide the configured BOM components.',
    )
    const seen = new Set()
    r.components = p.components.map((x: any) => {
      find(s, 'products', x.productId)
      assert(!seen.has(x.productId), 'Duplicate BOM product.')
      seen.add(x.productId)
      return { productId: x.productId, quantity: num(x.quantity, 0.01) }
    })
  } else if (action === 'quote') {
    can(role, 'quotations')
    const survey = find(s, 'surveys', p.surveyId)
    assert(survey.status === 'Approved', 'An approved site survey is required.')
    const pkg = find(s, 'packages', p.packageId)
    assert(
      pkg.components.length,
      'An administrator must configure this package BOM first.',
    )
    const items = pkg.components.map((x: any) => {
      const product = find(s, 'products', x.productId)
      return {
        ...x,
        name: product.name,
        price: product.price,
        cost: product.cost,
      }
    })
    const installationCharge = num(p.installationCharge),
      tax = num(p.tax),
      discount = num(p.discount)
    assert(tax <= 100, 'Tax must be 0–100%.')
    const subtotal =
      items.reduce((n: number, r: any) => n + r.quantity * r.price, 0) +
      installationCharge
    assert(discount <= subtotal, 'Discount exceeds quotation value.')
    const total =
      Math.round((subtotal - discount) * (1 + tax / 100) * 100) / 100
    assert(p.validUntil >= today(), 'Validity must be today or later.')
    result = add(s, 'quotations', {
      number: `QUO-${new Date().getFullYear()}-${String(s.quotations.length + 101)}`,
      customerId: survey.customerId,
      surveyId: survey.id,
      packageId: pkg.id,
      items,
      installationCharge,
      tax,
      discount,
      subsidy: num(p.subsidy),
      validUntil: p.validUntil,
      total,
      status: 'Draft',
    })
  } else if (action === 'quoteStatus') {
    can(role, 'quotations')
    const q = find(s, 'quotations', p.id)
    assert(
      (
        {
          Draft: ['Sent', 'Rejected'],
          Sent: ['Accepted', 'Rejected', 'Expired'],
        } as Record<string, string[]>
      )[q.status]?.includes(p.status),
      'Invalid quotation transition.',
    )
    assert(
      p.status !== 'Accepted' || q.validUntil >= today(),
      'This quotation has expired. Create a new quotation.',
    )
    q.status = p.status
    const c = find(s, 'customers', q.customerId)
    if (p.status === 'Sent') c.status = 'Quotation Sent'
    if (p.status === 'Accepted') {
      assert(
        !s.orders.some((o) => o.quotationId === q.id),
        'An order already exists for this quotation.',
      )
      result = add(s, 'orders', {
        number: `SO-${new Date().getFullYear()}-${s.orders.length + 101}`,
        customerId: q.customerId,
        quotationId: q.id,
        packageId: q.packageId,
        items: structuredClone(q.items),
        total: q.total,
        materialCost: q.items.reduce(
          (n: number, x: any) => n + x.cost * x.quantity,
          0,
        ),
        date: p.date || today(),
        status: 'Confirmed',
      })
      c.status = 'Converted'
    }
  } else if (action === 'payment') {
    can(role, 'payments')
    const o = find(s, 'orders', p.orderId)
    const paid = s.payments
      .filter((r) => r.orderId === o.id)
      .reduce((n, r) => n + (r.type === 'Refund' ? -r.amount : r.amount), 0)
    const amount = num(p.amount, 0.01)
    assert(
      amount <= o.total - paid + 0.001,
      'Payment exceeds the outstanding balance.',
    )
    assert(p.reference && p.date, 'Date and payment reference required.')
    assert(
      !s.payments.some((r) => r.reference === p.reference),
      'Payment reference already recorded.',
    )
    result = add(s, 'payments', {
      orderId: o.id,
      customerId: o.customerId,
      amount,
      date: p.date,
      method: p.method,
      reference: p.reference,
    })
  } else if (action === 'purchase') {
    can(role, 'products')
    assert(admin || role === 'Warehouse Manager', 'Warehouse access required.')
    const product = find(s, 'products', p.productId)
    find(s, 'suppliers', p.supplierId)
    const quantity = num(p.quantity, 1),
      cost = num(p.cost)
    assert(
      Number.isInteger(quantity),
      'Purchase quantity must be a whole number.',
    )
    let serials: string[] = []
    if (product.serialized) {
      serials = String(p.serials || '')
        .split(/[\n,]+/)
        .map((x) => x.trim())
        .filter(Boolean)
      assert(
        serials.length === quantity,
        'Supply one unique serial number per purchased unit.',
      )
      assert(
        new Set(serials).size === serials.length,
        'Duplicate serial numbers in purchase.',
      )
      assert(
        !serials.some((sn) => s.serials.some((x) => x.serial === sn)),
        'A serial number is already registered.',
      )
      serials.forEach((serial) =>
        add(s, 'serials', {
          productId: product.id,
          serial,
          supplierId: p.supplierId,
          purchaseDate: p.date || today(),
          cost,
          status: 'Available',
        }),
      )
    }
    product.stock += quantity
    product.cost = cost
    add(s, 'movements', {
      productId: product.id,
      supplierId: p.supplierId,
      quantity,
      cost,
      type: 'Purchase',
      date: p.date || today(),
    })
    if (p.paid !== 'Yes')
      find(s, 'suppliers', p.supplierId).outstanding =
        Number(find(s, 'suppliers', p.supplierId).outstanding || 0) +
        quantity * cost
  } else if (action === 'reserve') {
    assert(
      admin || role === 'Warehouse Manager',
      'Dispatch and reservation require warehouse access.',
    )
    const o = find(s, 'orders', p.id)
    assert(o.status === 'Confirmed', 'Only confirmed orders may reserve stock.')
    for (const item of o.items) {
      const product = find(s, 'products', item.productId)
      const reserved = s.orders
        .filter((x) => x.status === 'Reserved')
        .reduce(
          (n, r) =>
            n +
            r.items
              .filter((x: any) => x.productId === product.id)
              .reduce((m: number, x: any) => m + x.quantity, 0),
          0,
        )
      assert(
        product.stock - reserved >= item.quantity,
        `Insufficient stock: ${product.name}`,
      )
      if (product.serialized) {
        const units = s.serials
          .filter((r) => r.productId === product.id && r.status === 'Available')
          .slice(0, item.quantity)
        assert(
          units.length === item.quantity,
          `Insufficient available serials: ${product.name}`,
        )
        units.forEach((sn) => {
          sn.status = 'Reserved'
          sn.orderId = o.id
          sn.customerId = o.customerId
        })
      }
    }
    o.status = 'Reserved'
  } else if (action === 'dispatch') {
    assert(
      admin || role === 'Warehouse Manager',
      'Dispatch and reservation require warehouse access.',
    )
    const o = find(s, 'orders', p.id)
    assert(o.status === 'Reserved', 'Reserve this order before dispatch.')
    const paid = s.payments
      .filter((x) => x.orderId === o.id)
      .reduce((n, r) => n + (r.type === 'Refund' ? -r.amount : r.amount), 0)
    assert(
      paid + 0.001 >= (o.total * s.settings[0].advance) / 100,
      `At least ${s.settings[0].advance}% advance payment is required.`,
    )
    const expected = s.serials.filter(
      (r) => r.orderId === o.id && r.status === 'Reserved',
    )
    const scanned = String(p.serials || '')
      .split(/[\n,]+/)
      .map((x) => x.trim())
      .filter(Boolean)
    assert(
      scanned.length === expected.length &&
        new Set(scanned).size === scanned.length &&
        expected.every((sn) => scanned.includes(sn.serial)),
      'Enter every reserved serial exactly once.',
    )
    for (const item of o.items) {
      const product = find(s, 'products', item.productId)
      assert(product.stock >= item.quantity, 'Insufficient stock.')
      product.stock -= item.quantity
      add(s, 'movements', {
        productId: product.id,
        orderId: o.id,
        quantity: -item.quantity,
        type: 'Dispatch',
        date: today(),
      })
    }
    expected.forEach((sn) => (sn.status = 'Dispatched'))
    o.status = 'Dispatched'
  } else if (action === 'schedule') {
    can(role, 'installations')
    const o = find(s, 'orders', p.orderId)
    assert(
      ['Dispatched', 'Reserved', 'Confirmed'].includes(o.status),
      'Order cannot be scheduled.',
    )
    assert(
      p.date && p.time && p.assigned,
      'Date, time, and technician required.',
    )
    assert(
      !s.installations.some(
        (i) => i.orderId === o.id && !['Cancelled'].includes(i.status),
      ),
      'This order already has an installation.',
    )
    assert(
      !s.installations.some(
        (i) =>
          i.date === p.date &&
          i.assigned === p.assigned &&
          !['Cancelled', 'Completed'].includes(i.status),
      ),
      'Technician is already assigned on this date.',
    )
    result = add(s, 'installations', {
      orderId: o.id,
      customerId: o.customerId,
      date: p.date,
      time: p.time,
      assigned: p.assigned,
      status: 'Scheduled',
    })
  } else if (action === 'installStatus') {
    can(role, 'installations')
    const i = find(s, 'installations', p.id)
    assert(
      (
        {
          Scheduled: ['In Progress', 'Delayed', 'Cancelled'],
          Delayed: ['In Progress', 'Cancelled'],
        } as Record<string, string[]>
      )[i.status]?.includes(p.status),
      'Invalid installation transition.',
    )
    i.status = p.status
    if (p.status === 'In Progress') {
      assert(
        find(s, 'orders', i.orderId).status === 'Dispatched',
        'Dispatch equipment before beginning installation.',
      )
      i.startedAt = new Date().toISOString()
    }
  } else if (action === 'complete') {
    can(role, 'installations')
    const i = find(s, 'installations', p.id)
    assert(
      i.status === 'In Progress',
      'Begin installation before completing it.',
    )
    const o = find(s, 'orders', i.orderId)
    assert(
      o.status === 'Dispatched',
      'Order equipment must be dispatched first.',
    )
    assert(
      p.safety &&
        p.testing &&
        p.checklist &&
        String(p.signature || '').trim() &&
        p.generation &&
        p.photos?.length,
      'Complete all checklists, record generation results, upload a photo, and obtain customer acceptance.',
    )
    Object.assign(i, {
      checklist: !!p.checklist,
      safety: !!p.safety,
      testing: !!p.testing,
      generation: String(p.generation),
      photos: p.photos,
      signature: String(p.signature),
      observations: String(p.observations || ''),
      status: 'Completed',
      finishedAt: today(),
    })
    o.status = 'Completed'
    for (const item of o.items) {
      const product = find(s, 'products', item.productId)
      const units = s.serials.filter(
        (sn) => sn.orderId === o.id && sn.productId === product.id,
      )
      if (!product.serialized)
        for (let n = 0; n < item.quantity; n++)
          units.push(
            add(s, 'serials', {
              serial: `ASSET-${o.number}-${product.sku}-${n + 1}`,
              productId: product.id,
              orderId: o.id,
              customerId: o.customerId,
              status: 'Installed',
              assetTag: true,
            }),
          )
      units.forEach((sn) => {
        sn.status = 'Installed'
        sn.installationId = i.id
        if (product.warrantyMonths > 0) {
          const expiry = warrantyExpiry(today(), product.warrantyMonths)
          add(s, 'warranties', {
            serialId: sn.id,
            productId: product.id,
            customerId: o.customerId,
            installationId: i.id,
            start: today(),
            expiry,
            status: 'Active',
          })
        }
      })
    }
  } else if (action === 'warrantyCorrect') {
    requireAdmin()
    const w = find(s, 'warranties', p.id)
    assert(
      p.reason && p.start && p.expiry && p.expiry >= p.start,
      'Valid dates and an audit reason are required.',
    )
    auditBefore = { start: w.start, expiry: w.expiry }
    w.start = p.start
    w.expiry = p.expiry
  } else if (action === 'ticketStatus') {
    can(role, 'tickets')
    const t = find(s, 'tickets', p.id)
    const paths: Record<string, string[]> = {
      Open: ['Assigned'],
      Assigned: ['In Progress'],
      'In Progress': ['Waiting for Parts', 'Resolved'],
      'Waiting for Parts': ['In Progress'],
      Resolved: ['Closed', 'In Progress'],
    }
    assert(
      paths[t.status]?.includes(p.status),
      'Invalid service status transition.',
    )
    if (p.status === 'Resolved')
      assert(p.notes, 'Resolution notes are required.')
    if (p.status === 'Closed')
      assert(p.confirmed, 'Customer confirmation is required before closing.')
    t.status = p.status
    t.notes = p.notes || t.notes
    t.confirmed = !!p.confirmed
    add(s, 'followups', {
      customerId: t.customerId,
      serialId: t.serialId,
      ticketId: t.id,
      date: today(),
      notes: `Service ${p.status}: ${p.notes || ''}`,
    })
  } else if (action === 'refund') {
    requireAdmin()
    const o = find(s, 'orders', p.id)
    const received = s.payments
      .filter((r) => r.orderId === o.id)
      .reduce((n, r) => n + (r.type === 'Refund' ? -r.amount : r.amount), 0)
    const amount = num(p.amount, 0.01)
    assert(amount <= received, 'Refund exceeds payments received.')
    assert(
      p.reference && p.reason,
      'A refund reference and reason are required.',
    )
    assert(
      !s.payments.some((r) => r.reference === p.reference),
      'Payment reference already exists.',
    )
    add(s, 'payments', {
      orderId: o.id,
      customerId: o.customerId,
      amount,
      type: 'Refund',
      date: p.date || today(),
      method: p.method || 'Bank transfer',
      reference: p.reference,
      reason: p.reason,
    })
  } else if (action === 'delivery') {
    assert(admin || role === 'Warehouse Manager', 'Warehouse access required.')
    const o = find(s, 'orders', p.id)
    assert(
      o.status === 'Dispatched',
      'Dispatch equipment before confirming delivery.',
    )
    assert(p.receivedBy && p.date, 'Delivery date and recipient required.')
    o.deliveryDate = p.date
    o.receivedBy = p.receivedBy
  } else if (action === 'subsidy') {
    can(role, 'quotations')
    const o = find(s, 'orders', p.id)
    assert(
      [
        'Not requested',
        'Documents pending',
        'Submitted',
        'Approved',
        'Received',
        'Rejected',
      ].includes(p.subsidyStatus),
      'Invalid paperwork status.',
    )
    o.subsidyStatus = p.subsidyStatus
    o.subsidyReference = p.subsidyReference || ''
  } else if (action === 'supplierPayment') {
    assert(
      admin || role === 'Warehouse Manager',
      'Warehouse or administrator access required.',
    )
    const supplier = find(s, 'suppliers', p.id)
    const amount = num(p.amount, 0.01)
    assert(
      amount <= Number(supplier.outstanding || 0),
      'Payment exceeds supplier balance.',
    )
    assert(p.reference, 'A payment reference is required.')
    supplier.outstanding -= amount
    add(s, 'movements', {
      supplierId: supplier.id,
      type: 'Supplier payment',
      amount,
      reference: p.reference,
      date: today(),
      quantity: 0,
    })
  } else if (action === 'coverageException') {
    requireAdmin()
    const t = find(s, 'tickets', p.id)
    assert(p.reason, 'An exception reason is required.')
    t.parts = num(p.parts)
    t.labour = num(p.labour)
    t.coverageException = p.reason
  } else if (action === 'replaceEquipment') {
    can(role, 'tickets')
    const t = find(s, 'tickets', p.id)
    assert(
      !['Resolved', 'Closed'].includes(t.status),
      'Ticket is already resolved.',
    )
    const old = find(s, 'serials', t.serialId)
    const unit = s.serials.find(
      (sn) =>
        sn.serial === p.serial &&
        sn.productId === old.productId &&
        sn.status === 'Available',
    )
    assert(unit, 'Replacement must be an available serial of the same product.')
    const product = find(s, 'products', old.productId)
    const reserved = s.orders
      .filter((o) => o.status === 'Reserved')
      .reduce(
        (n, o) =>
          n +
          o.items
            .filter((x: any) => x.productId === product.id)
            .reduce((m: number, x: any) => m + x.quantity, 0),
        0,
      )
    assert(
      product.stock - reserved >= 1,
      'Replacement stock is reserved for other orders.',
    )
    assert(p.reason, 'Record a replacement reason.')
    old.status = 'Replaced'
    unit!.status = 'Installed'
    unit!.customerId = old.customerId
    unit!.orderId = old.orderId
    unit!.installationId = old.installationId
    product.stock -= 1
    const warranty = s.warranties.find((w) => w.serialId === old.id)
    if (warranty) {
      warranty.status = 'Replaced'
      add(s, 'warranties', {
        productId: old.productId,
        serialId: unit!.id,
        customerId: old.customerId,
        installationId: old.installationId,
        start: today(),
        expiry: warranty.expiry,
        status: warranty.expiry >= today() ? 'Active' : 'Expired',
      })
    }
    add(s, 'movements', {
      productId: product.id,
      orderId: old.orderId,
      type: 'Service replacement',
      quantity: -1,
      date: today(),
    })
    add(s, 'followups', {
      customerId: old.customerId,
      serialId: old.id,
      ticketId: t.id,
      date: today(),
      notes: `Replaced ${old.serial} with ${unit!.serial}. ${p.reason}`,
    })
    t.replacementSerialId = unit!.id
    t.notes = p.reason
  } else throw new Error('Unknown workflow action.')
  add(s, 'audit', {
    actor,
    role,
    action,
    recordId: p.id || result?.id || null,
    reason: p.reason || null,
    details:
      action === 'warrantyCorrect'
        ? { before: auditBefore, after: { start: p.start, expiry: p.expiry } }
        : undefined,
  })
  return result
}
