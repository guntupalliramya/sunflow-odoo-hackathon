import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import { money, type State, type Row } from '../../shared/domain'
export function documentPdf(kind: string, r: Row, s: State, print = false) {
  const doc = new jsPDF()
  let y = 25
  const line = (text: string, size = 11) => {
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(
      text.replace(/₹/g, 'INR ').replace(/—/g, '-').replace(/•/g, ' / '),
      170,
    )
    if (y + lines.length * 6 > 275) {
      doc.addPage()
      y = 20
    }
    doc.text(lines, 20, y)
    y += lines.length * 6 + 4
  }
  line('SUNFLOW AI', 23)
  line('SunPower Solutions • Solar Installation Management', 11)
  line(kind.toUpperCase(), 17)
  line(r.number || r.reference || r.id)
  line(
    'Customer: ' +
      (s.customers.find((c) => c.id === r.customerId)?.name ||
        s.customers.find(
          (c) => c.id === s.orders.find((o) => o.id === r.orderId)?.customerId,
        )?.name ||
        ''),
  )
  if (r.items) {
    r.items.forEach((x: any) =>
      line(
        `${x.name} | ${x.quantity} × ${money(x.price)} = ${money(x.quantity * x.price)}`,
      ),
    )
    line('Installation charge: ' + money(r.installationCharge || 0))
    line(`Tax: ${r.tax || 0}%  |  Discount: ${money(r.discount || 0)}`)
    line('Total: ' + money(r.total), 16)
    line(
      'Subsidy information (separate, subject to eligibility): ' +
        money(r.subsidy || 0),
    )
    line('Valid until: ' + (r.validUntil || '—'))
  } else if (kind === 'Payment receipt' || kind === 'Service invoice') {
    line(
      (kind === 'Service invoice'
        ? 'Service charges: '
        : r.type === 'Refund'
          ? 'Refunded: '
          : 'Paid: ') + money(r.amount),
      17,
    )
    line('Date: ' + r.date)
    if (r.method) line('Method: ' + r.method)
    if (r.reference) line('Reference: ' + r.reference)
    if (r.description) line('Service: ' + r.description)
  } else {
    for (const [k, v] of Object.entries(r)) {
      if (
        ['id', 'customerId', 'createdAt', 'updatedAt', 'photos'].includes(k) ||
        typeof v === 'object'
      )
        continue
      line(`${k.replace(/([A-Z])/g, ' $1')}: ${String(v)}`)
    }
  }
  line('Generated ' + new Date().toLocaleString('en-IN'))
  if (print) {
    doc.autoPrint()
    const url = doc.output('bloburl')
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  doc.save(`${kind.replace(/ /g, '-')}-${r.number || r.id.slice(0, 8)}.pdf`)
}
export function exportCsv(rows: Record<string, any>[], name: string) {
  if (!rows.length) {
    toast.info('No records match the current filters.')
    return
  }
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter(
    (k) => !['items', 'components', 'photos'].includes(k),
  )
  const escape = (v: any) => {
    const text = String(v ?? '')
    return (
      '"' +
      (/^[=+@\-]/.test(text) ? "'" + text : text).replace(/"/g, '""') +
      '"'
    )
  }
  const csv = [
    keys.map(escape).join(','),
    ...rows.map((r) =>
      keys
        .map((k) =>
          escape(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k]),
        )
        .join(','),
    ),
  ].join('\r\n')
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `sunflow-${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
