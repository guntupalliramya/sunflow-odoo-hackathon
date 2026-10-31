import { AuthScreen } from './auth'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  ShoppingBag,
  Package,
  Sun,
  ShieldCheck,
  Wrench,
  ChartNoAxesCombined,
  Sparkles,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  ArrowRight,
  Menu,
  PanelLeftClose,
  X,
  CalendarDays,
  Wallet,
  TrendingUp,
  Clock,
  Check,
  LogOut,
  Send,
  RotateCcw,
  Camera,
  Leaf,
  Info,
  TriangleAlert,
  MoreHorizontal,
  UserRound,
  LoaderCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  logout,
  getUser,
  handleAuthCallback,
  onAuthChange,
} from '@netlify/identity'
import {
  empty,
  metrics,
  money,
  roles,
  permissions,
  today,
  type State,
  type Row,
  type Collection,
} from '../../shared/domain'
import { fields, statuses, titles, type Field } from './config'
import { documentPdf, exportCsv } from './documents'
type Session = {
  role: string
  name: string
  demo: boolean
  organizationId: string
}
type Modal = {
  title: string
  fields: Field[]
  action: string
  payload?: any
  collection?: string
  id?: string
  description?: string
}
const nav = [
  ['dashboard', LayoutDashboard],
  ['customers', Users],
  ['surveys', ClipboardCheck],
  ['quotations', FileText],
  ['orders', ShoppingBag],
  ['products', Package],
  ['installations', Sun],
  ['warranties', ShieldCheck],
  ['tickets', Wrench],
  ['finance', ChartNoAxesCombined],
  ['assistant', Sparkles],
  ['settings', Settings],
] as const
const color = ['#24856a', '#a8c6ae', '#e9b94a', '#e9edf0', '#7ca8a3']
const shortMoney = (n: number) =>
  n >= 100000 ? '₹' + (n / 100000).toFixed(2) + 'L' : money(n)
const dateText = (d: string) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
function Badge({ children }: { children: any }) {
  const v = String(children || '')
  return (
    <span className={'status status-' + v.toLowerCase().replace(/[^a-z]/g, '')}>
      {v || '—'}
    </span>
  )
}
function Avatar({ name, size = '' }: { name: string; size?: string }) {
  return (
    <span className={'avatar ' + size}>
      {name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')}
    </span>
  )
}
export default function SunFlowApp() {
  const [s, setS] = useState<State>(empty),
    [user, setUser] = useState<Session | null>(null),
    [page, setPage] = useState('dashboard'),
    [tab, setTab] = useState('products'),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('All statuses'),
    [range, setRange] = useState('This Month'),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [modal, setModal] = useState<Modal | null>(null),
    [detail, setDetail] = useState<{ kind: string; row: Row } | null>(null),
    [chat, setChat] = useState(false),
    [showLogin, setShowLogin] = useState(false),
    [notifications, setNotifications] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false),
    [authCallback, setAuthCallback] = useState<{
      type: string
      token?: string
    } | null>(null)
  const go = (p: string) => {
    setPage(p)
    setQuery('')
    setFilter('All statuses')
    setMobile(false)
    setDetail(null)
    if (typeof window !== 'undefined')
      window.history.replaceState(null, '', '#' + p)
  }
  async function request(action?: string, payload?: any) {
    const res = await fetch(
      '/api/workspace',
      action
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
          }
        : undefined,
    )
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 401) {
        setUser(null)
        setS(empty())
        setChat(false)
      }
      throw new Error(data.error || 'Could not load your workspace.')
    }
    setError('')
    setS(data.state)
    setUser(data.user)
    if (action === 'role') {
      setTab('products')
      sessionStorage.removeItem('sunflow-chat')
      setChat(false)
    }
    return data
  }
  useEffect(() => {
    ;(async () => {
      try {
        const r = await handleAuthCallback()
        if (r && ['invite', 'recovery'].includes(r.type)) {
          setAuthCallback({
            type: r.type,
            token: 'token' in r ? r.token : undefined,
          })
          return
        }
        if (r)
          document.cookie =
            'sunflow_session=active; Path=/; SameSite=Lax; Secure'
        if (
          !document.cookie
            .split('; ')
            .some((c) => c === 'sunflow_session=active') &&
          (await getUser())
        )
          await logout()
        await request()
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Unable to load your account.',
        )
      } finally {
        setLoading(false)
      }
    })()
    const p = window.location.hash.slice(1)
    if (nav.some((n) => n[0] === p) || p === 'overview') setPage(p)
  }, [])
  useEffect(
    () =>
      onAuthChange((event) => {
        if (event === 'logout') {
          setUser(null)
          setS(empty())
          setChat(false)
          sessionStorage.removeItem('sunflow-chat')
        }
      }),
    [],
  )
  async function act(
    action: string,
    payload: any = {},
    message = 'Changes saved',
  ) {
    setBusy(true)
    try {
      await request(action, payload)
      setDetail(null)
      toast.success(message)
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to save changes.')
      return false
    } finally {
      setBusy(false)
    }
  }
  const allowed = (p: string) =>
    p === 'dashboard' ||
    p === 'assistant' ||
    p === 'overview' ||
    p === 'settings' ||
    (p === 'finance' && user?.role === 'Admin / Director') ||
    !!permissions[user?.role || '']?.includes(p)
  useEffect(() => {
    if (user && !allowed(page)) setPage('dashboard')
  }, [user, page])
  const canEdit = (k: string) => {
    if (!user) return false
    if (k === 'serials')
      return ['Admin / Director', 'Warehouse Manager'].includes(user.role)
    return (
      permissions[user.role]?.includes(k) &&
      (!['products', 'packages', 'suppliers', 'settings'].includes(k) ||
        user.role === 'Admin / Director' ||
        (user.role === 'Warehouse Manager' && k !== 'settings'))
    )
  }
  const openForm = (kind: string, row?: Row, payload?: any) => {
    const action = [
      'quote',
      'payment',
      'purchase',
      'schedule',
      'dispatch',
      'complete',
      'warrantyCorrect',
      'ticketStatus',
      'bom',
      'delivery',
      'subsidy',
      'supplierPayment',
      'coverageException',
      'replaceEquipment',
      'refund',
      'teamRole',
    ].includes(kind)
      ? kind
      : 'save'
    setModal({
      title:
        (row && action === 'save' ? 'Edit ' : '') +
        ((
          {
            quote: 'Create quotation',
            payment: 'Record payment',
            purchase: 'Receive stock',
            schedule: 'Schedule installation',
            dispatch: 'Confirm dispatch',
            complete: 'Complete installation',
            warrantyCorrect: 'Correct warranty dates',
            ticketStatus: 'Update service ticket',
            bom: 'Add BOM component',
            delivery: 'Record delivery',
            subsidy: 'Subsidy paperwork',
            supplierPayment: 'Record supplier payment',
            coverageException: 'Warranty coverage exception',
            replaceEquipment: 'Replace equipment',
            refund: 'Record payment refund',
            teamRole: 'Assign team access',
          } as Record<string, string>
        )[kind] ||
          (row && action === 'save' ? '' : 'New ') + (titles[kind] || kind)),
      fields: fields(kind, s, row).map((f) =>
        kind === 'quote' && f.key === 'tax'
          ? { ...f, value: s.settings[0]?.tax ?? 5 }
          : f,
      ),
      action,
      collection: action === 'save' ? kind : undefined,
      id: row?.id,
      payload,
      description:
        kind === 'dispatch'
          ? 'All reserved serials and the configured advance payment are validated before stock leaves the warehouse.'
          : kind === 'complete'
            ? 'Customer acceptance and completed commissioning checks activate equipment warranties.'
            : kind === 'quote'
              ? 'Only approved surveys and configured package BOMs are available. Subsidy is recorded separately from the sales total.'
              : undefined,
    })
  }
  async function saveForm(values: any) {
    if (!modal) return
    let payload = { ...modal.payload, ...values }
    if (modal.action === 'save')
      payload = { collection: modal.collection, id: modal.id, data: values }
    else if (modal.action === 'bom') {
      const pkg = s.packages.find((p) => p.id === modal.id)!
      payload = {
        id: modal.id,
        components: [
          ...pkg.components,
          { productId: values.productId, quantity: values.quantity },
        ],
      }
    } else if (modal.id) payload.id = modal.id
    const ok = await act(modal.action, payload)
    if (ok) setModal(null)
    return ok
  }
  const inRange = (r: Row, dateKey = 'createdAt') => {
    const day = String(r[dateKey] || r.createdAt).slice(0, 10)
    const now = today()
    if (range === 'All Time') return true
    if (range === 'Today') return day === now
    if (range === 'This Month') return day.slice(0, 7) === now.slice(0, 7)
    if (range === 'This Week') {
      const d = new Date()
      d.setDate(d.getDate() - d.getDay())
      return day >= d.toISOString().slice(0, 10) && day <= now
    }
    return (!start || day >= start) && (!end || day <= end)
  }
  const scoped = {
    ...s,
    customers: s.customers.filter((r) => inRange(r)),
    orders: s.orders.filter((r) => inRange(r)),
    payments: s.payments.filter((r) => inRange(r, 'date')),
    installations: s.installations.filter((r) => inRange(r, 'date')),
    expenses: s.expenses.filter((r) => inRange(r, 'date')),
    tickets: s.tickets.filter((r) => inRange(r, 'date')),
  }
  const m = metrics(scoped)
  const customer = (id: string) =>
    s.customers.find((c) => c.id === id)?.name || '—'
  const product = (id: string) =>
    s.products.find((c) => c.id === id)?.name || '—'
  const paid = (id: string) =>
    s.payments
      .filter((p) => p.orderId === id)
      .reduce(
        (n, p) =>
          n + (p.type === 'Refund' ? -Number(p.amount) : Number(p.amount)),
        0,
      )
  const paymentStatus = (o: Row) =>
    s.payments.some((p) => p.orderId === o.id && p.type === 'Refund') &&
    paid(o.id) <= 0
      ? 'Refunded'
      : paid(o.id) >= o.total
        ? 'Paid'
        : paid(o.id) > 0
          ? 'Partially Paid'
          : 'Pending'
  const view = (kind: string, row: Row) => setDetail({ kind, row })
  const headerAction =
    page === 'customers'
      ? () => openForm('customers')
      : page === 'surveys'
        ? () => openForm('surveys')
        : page === 'quotations'
          ? () => openForm('quote')
          : page === 'products'
            ? () =>
                openForm(
                  tab === 'products'
                    ? 'products'
                    : tab === 'packages'
                      ? 'packages'
                      : tab === 'suppliers'
                        ? 'suppliers'
                        : 'purchase',
                )
            : page === 'installations'
              ? () => openForm('schedule')
              : page === 'tickets'
                ? () => openForm('tickets')
                : page === 'finance'
                  ? () => openForm('expenses')
                  : null
  const actionText: Record<string, string> = {
    customers: 'New enquiry',
    surveys: 'Schedule survey',
    quotations: 'Create quotation',
    products:
      tab === 'products'
        ? 'Add product'
        : tab === 'packages'
          ? 'New package'
          : tab === 'suppliers'
            ? 'Add supplier'
            : 'Receive stock',
    installations: 'Schedule installation',
    tickets: 'Raise a ticket',
    finance: 'Record expense',
  }
  const financeAccess = user?.role === 'Admin / Director'
  const monthChart = Array.from({ length: 6 }, (_, i) => {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key =
      String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0')
    const orders = s.orders.filter(
      (o) => String(o.createdAt).startsWith(key) && inRange(o),
    )
    return {
      name: d.toLocaleDateString('en', { month: 'short' }),
      revenue: orders.reduce((n, o) => n + o.total, 0),
      expenses:
        s.expenses
          .filter((e) => String(e.date).startsWith(key) && inRange(e, 'date'))
          .reduce((n, e) => n + e.amount, 0) +
        orders
          .filter((o) => ['Completed', 'Dispatched'].includes(o.status))
          .reduce((n, o) => n + Number(o.materialCost || 0), 0),
    }
  })
  const installChart = ['Completed', 'In Progress', 'Scheduled', 'Delayed'].map(
    (name) => ({
      name,
      value: scoped.installations.filter((i) => i.status === name).length,
    }),
  )
  const filterBar = (
    <div className="filter-row">
      <div className="search-input">
        <Search size={16} />
        <input
          aria-label="Search records"
          placeholder="Search by name, number, or details…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <select
        aria-label="Filter status"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option>All statuses</option>
        {(statuses[(page === 'products' ? tab : page) as Collection] || []).map(
          (v) => (
            <option key={v}>{v}</option>
          ),
        )}
      </select>
      <button
        className="button secondary"
        onClick={() => {
          const k = (page === 'products' ? tab : page) as Collection
          exportCsv(filtered(k), 'records')
        }}
      >
        <Download size={15} />
        Export CSV
      </button>
    </div>
  )
  function filtered(k: Collection) {
    return (s[k] || []).filter((r) => {
      const text = [
        ...Object.values(r),
        customer(r.customerId),
        product(r.productId),
      ]
        .join(' ')
        .toLowerCase()
      return (
        (!query || text.includes(query.toLowerCase())) &&
        (filter === 'All statuses' || r.status === filter) &&
        inRange(r)
      )
    })
  }
  function table(
    k: Collection,
    columns: { label: string; render: (r: Row) => any }[],
    rows?: Row[],
  ) {
    const data = rows || filtered(k)
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr
                key={r.id}
                onClick={() => view(k, r)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && view(k, r)}
              >
                {columns.map((c) => (
                  <td key={c.label}>{c.render(r)}</td>
                ))}
                <td>
                  <button
                    className="icon-button"
                    aria-label="View record"
                    onClick={(e) => {
                      e.stopPropagation()
                      view(k, r)
                    }}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && (
          <div className="empty">
            <Package size={30} />
            <h3>No records found</h3>
            <p>Try another filter or add a record to get started.</p>
          </div>
        )}
      </div>
    )
  }
  const nameCol = {
    label: 'Customer',
    render: (r: Row) => (
      <div className="person">
        <Avatar name={r.name || customer(r.customerId)} />
        <div>
          <strong>{r.name || customer(r.customerId)}</strong>
          <small>{r.city || r.number || r.phone || ''}</small>
        </div>
      </div>
    ),
  }
  const statusCol = {
    label: 'Status',
    render: (r: Row) => <Badge>{r.status}</Badge>,
  }
  const moduleContent = () => {
    if (page === 'customers')
      return table('customers', [
        nameCol,
        {
          label: 'Contact',
          render: (r) => (
            <>
              <span>{r.phone}</span>
              <small>{r.email}</small>
            </>
          ),
        },
        {
          label: 'Requirement',
          render: (r) => (
            <>
              {r.capacity} kW <small>{r.system}</small>
            </>
          ),
        },
        { label: 'Sales executive', render: (r) => r.assigned },
        statusCol,
        { label: 'Enquiry date', render: (r) => dateText(r.createdAt) },
      ])
    if (page === 'surveys')
      return table('surveys', [
        nameCol,
        { label: 'Technician', render: (r) => r.assigned },
        { label: 'Survey date', render: (r) => dateText(r.date) },
        {
          label: 'Recommendation',
          render: (r) => `${r.capacity} kW • ${r.area} m²`,
        },
        statusCol,
      ])
    if (page === 'quotations')
      return table('quotations', [
        { label: 'Quotation', render: (r) => <strong>{r.number}</strong> },
        nameCol,
        {
          label: 'Package',
          render: (r) => s.packages.find((p) => p.id === r.packageId)?.name,
        },
        { label: 'Total', render: (r) => <strong>{money(r.total)}</strong> },
        { label: 'Valid until', render: (r) => dateText(r.validUntil) },
        statusCol,
      ])
    if (page === 'orders')
      return table('orders', [
        { label: 'Order', render: (r) => <strong>{r.number}</strong> },
        nameCol,
        { label: 'Amount', render: (r) => money(r.total) },
        { label: 'Balance', render: (r) => money(r.total - paid(r.id)) },
        { label: 'Payment', render: (r) => <Badge>{paymentStatus(r)}</Badge> },
        statusCol,
      ])
    if (page === 'products') {
      if (tab === 'products')
        return table('products', [
          {
            label: 'Product',
            render: (r) => (
              <div className="person">
                <span className="product-icon">
                  <Package size={19} />
                </span>
                <div>
                  <strong>{r.name}</strong>
                  <small>{r.sku}</small>
                </div>
              </div>
            ),
          },
          { label: 'Category', render: (r) => r.category },
          { label: 'Unit price', render: (r) => money(r.price) },
          {
            label: 'Available / physical',
            render: (r) => {
              const reserved = s.orders
                .filter((o) => o.status === 'Reserved')
                .reduce(
                  (n, o) =>
                    n +
                    o.items
                      .filter((x: any) => x.productId === r.id)
                      .reduce((n: number, x: any) => n + x.quantity, 0),
                  0,
                )
              return (
                <strong className={r.stock <= r.reorder ? 'text-amber' : ''}>
                  {r.stock - reserved} / {r.stock}
                </strong>
              )
            },
          },
          {
            label: 'Stock status',
            render: (r) => (
              <Badge>{r.stock <= r.reorder ? 'Low Stock' : 'In Stock'}</Badge>
            ),
          },
          { label: 'Warranty', render: (r) => r.warrantyMonths + ' months' },
        ])
      if (tab === 'serials')
        return table('serials', [
          {
            label: 'Serial number',
            render: (r) => <strong className="mono">{r.serial}</strong>,
          },
          { label: 'Product', render: (r) => product(r.productId) },
          nameCol,
          statusCol,
          { label: 'Purchased', render: (r) => dateText(r.purchaseDate) },
        ])
      if (tab === 'packages')
        return table('packages', [
          { label: 'Solar package', render: (r) => <strong>{r.name}</strong> },
          { label: 'System', render: (r) => r.system },
          { label: 'Capacity', render: (r) => r.capacity + ' kW' },
          { label: 'BOM components', render: (r) => r.components?.length || 0 },
          {
            label: 'Ready to quote',
            render: (r) => (
              <Badge>{r.components?.length ? 'Configured' : 'Needs BOM'}</Badge>
            ),
          },
        ])
      if (tab === 'suppliers')
        return table('suppliers', [
          { label: 'Supplier', render: (r) => <strong>{r.name}</strong> },
          { label: 'Contact', render: (r) => r.phone },
          { label: 'Email', render: (r) => r.email },
          { label: 'Payable', render: (r) => money(r.outstanding) },
        ])
      return table('movements', [
        { label: 'Date', render: (r) => dateText(r.date) },
        { label: 'Product', render: (r) => product(r.productId) },
        { label: 'Type', render: (r) => <Badge>{r.type}</Badge> },
        { label: 'Quantity', render: (r) => r.quantity },
        { label: 'Unit cost', render: (r) => money(r.cost) },
      ])
    }
    if (page === 'installations')
      return table('installations', [
        nameCol,
        {
          label: 'Job date',
          render: (r) => (
            <>
              {dateText(r.date)}
              <small>{r.time || '09:00'}</small>
            </>
          ),
        },
        {
          label: 'Crew lead',
          render: (r) => (
            <div className="person">
              <Avatar name={r.assigned} />
              {r.assigned}
            </div>
          ),
        },
        {
          label: 'Order',
          render: (r) => s.orders.find((o) => o.id === r.orderId)?.number,
        },
        statusCol,
      ])
    if (page === 'warranties')
      return table('warranties', [
        {
          label: 'Product',
          render: (r) => <strong>{product(r.productId)}</strong>,
        },
        {
          label: 'Serial',
          render: (r) => (
            <span className="mono">
              {s.serials.find((sn) => sn.id === r.serialId)?.serial}
            </span>
          ),
        },
        nameCol,
        { label: 'Start date', render: (r) => dateText(r.start) },
        { label: 'Expiry date', render: (r) => dateText(r.expiry) },
        {
          label: 'Coverage',
          render: (r) => (
            <Badge>
              {r.status === 'Active' && r.expiry < today()
                ? 'Expired'
                : r.status}
            </Badge>
          ),
        },
      ])
    if (page === 'tickets')
      return table('tickets', [
        { label: 'Ticket', render: (r) => <strong>{r.number}</strong> },
        nameCol,
        {
          label: 'Complaint',
          render: (r) => <span className="truncate">{r.description}</span>,
        },
        { label: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
        { label: 'Technician', render: (r) => r.assigned },
        statusCol,
      ])
    return null
  }
  if (loading)
    return (
      <div className="auth-loading" role="status">
        <Sun size={36} />
        <p>Opening SunFlow AI…</p>
      </div>
    )
  if (!user || authCallback)
    return (
      <AuthScreen
        callback={authCallback}
        error={error.startsWith('Authentication required') ? '' : error}
        onDone={async () => {
          setAuthCallback(null)
          try {
            await request()
            go('dashboard')
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'Unable to open workspace.',
            )
            throw e
          }
        }}
        onDemo={async () => {
          await request('startDemo')
          setAuthCallback(null)
          go('dashboard')
        }}
      />
    )
  return (
    <div className={'app ' + (collapsed ? 'is-collapsed' : '')}>
      <aside className={'sidebar ' + (mobile ? 'mobile-open' : '')}>
        <a
          className="brand"
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault()
            go('dashboard')
          }}
        >
          <span className="brand-icon">
            <Sun size={25} />
          </span>
          <span>
            SunFlow<span className="brand-ai"> AI</span>
            <small>SOLAR MANAGEMENT</small>
          </span>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>SunPower Solutions</span>
          <ChevronDown size={13} />
        </div>
        <nav>
          {nav.map(
            ([id, Icon], i) =>
              allowed(id) && (
                <div key={id}>
                  {i === 9 && <div className="nav-divider" />}
                  <button
                    className={'nav-item ' + (page === id ? 'active' : '')}
                    onClick={() => go(id)}
                    title={titles[id]}
                  >
                    <Icon size={19} />
                    <span>{titles[id]}</span>
                    {id === 'tickets' && m.open > 0 && <b>{m.open}</b>}
                    {id === 'assistant' && <span className="ai-label">AI</span>}
                  </button>
                </div>
              ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <button className="guide-card" onClick={() => go('overview')}>
            <span className="guide-sun">
              <Leaf size={22} />
            </span>
            <strong>Powering a brighter future</strong>
            <small>One rooftop at a time.</small>
            <span>
              Explore SunFlow <ArrowUpRight size={14} />
            </span>
          </button>
          <button
            className="collapse-button"
            onClick={() => {
              setCollapsed(!collapsed)
              setMobile(false)
            }}
          >
            <PanelLeftClose size={17} />
            <span>Collapse sidebar</span>
          </button>
          <button className="user-card" onClick={() => setShowLogin(true)}>
            <Avatar name={user?.name || 'Aarav Singh'} />
            <div>
              <strong>{user?.name || 'Aarav Singh'}</strong>
              <small>{user?.role || 'Admin / Director'}</small>
            </div>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
      {mobile && (
        <div className="mobile-shade" onClick={() => setMobile(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{titles[page]}</strong>
          </div>
          <div className="top-actions">
            <span className="live-indicator">
              <i />{' '}
              {loading
                ? 'Connecting…'
                : error
                  ? 'Connection issue'
                  : 'System online'}
            </span>
            <button className="demo-pill" onClick={() => go('settings')}>
              {user?.demo === false ? 'LIVE WORKSPACE' : 'DEMO MODE'}
            </button>
            <button
              className="notification-button icon-button"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={20} />
              {m.open + m.low > 0 && <i />}
            </button>
            <span className="top-divider" />
            <button
              className="profile-avatar"
              onClick={() => setShowLogin(true)}
              aria-label="Account and login"
            >
              <Avatar name={user?.name || 'Aarav Singh'} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">SUNPOWER SOLUTIONS</div>
              <h1>
                {page === 'dashboard'
                  ? 'Your solar business, at a glance.'
                  : titles[page]}
              </h1>
              <p>
                {
                  (
                    {
                      dashboard:
                        'A little more sunshine. A lot more progress. Here’s where things stand.',
                      customers:
                        'Turn conversations into clean energy. Every customer, in one place.',
                      surveys:
                        'Build on the right foundation with engineer-approved site assessments.',
                      quotations:
                        'Accurate proposals, configured components, and a clear path to an order.',
                      orders:
                        'Follow every project from confirmation to customer handover.',
                      products:
                        'The right components. In the right place. Ready for your next installation.',
                      installations:
                        'Keep your crews coordinated and your projects moving.',
                      warranties:
                        'Long-term peace of mind, linked to every installed component.',
                      tickets:
                        'Care that continues long after the panels go up.',
                      finance: 'Understand the numbers behind every rooftop.',
                      assistant:
                        'A helping hand, grounded in your actual business records.',
                      settings: 'Make SunFlow work for your team.',
                      overview:
                        'From the first enquiry to a lifetime of clean energy.',
                    } as Record<string, string>
                  )[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {page === 'dashboard' ? (
                <>
                  <button
                    className="button secondary"
                    onClick={() =>
                      exportCsv([metrics(scoped)], 'dashboard-report')
                    }
                  >
                    <Download size={16} />
                    Export report
                  </button>
                  {canEdit('customers') && (
                    <button
                      className="button"
                      onClick={() => openForm('customers')}
                    >
                      <Plus size={17} />
                      New enquiry
                    </button>
                  )}
                </>
              ) : (
                headerAction &&
                canEdit(
                  page === 'finance'
                    ? 'expenses'
                    : page === 'products'
                      ? tab
                      : page,
                ) && (
                  <button className="button" onClick={headerAction}>
                    <Plus size={17} />
                    {actionText[page]}
                  </button>
                )
              )}
            </div>
          </div>
          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="error-panel">
              <TriangleAlert />
              <h2>Workspace unavailable</h2>
              <p>{error}</p>
              <button
                className="button"
                onClick={() => {
                  setLoading(true)
                  setError('')
                  request()
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false))
                }}
              >
                Retry connection
              </button>
            </div>
          ) : (
            <>
              {page !== 'assistant' &&
                page !== 'settings' &&
                page !== 'overview' && (
                  <div className="period-row">
                    <div className="period-tabs">
                      {[
                        'Today',
                        'This Week',
                        'This Month',
                        'All Time',
                        'Custom',
                      ].map((r) => (
                        <button
                          key={r}
                          className={range === r ? 'selected' : ''}
                          onClick={() => setRange(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {range === 'Custom' ? (
                      <div className="date-controls">
                        <input
                          type="date"
                          aria-label="Start date"
                          value={start}
                          onChange={(e) => setStart(e.target.value)}
                        />
                        <span>—</span>
                        <input
                          type="date"
                          aria-label="End date"
                          value={end}
                          onChange={(e) => setEnd(e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="period-date">
                        <CalendarDays size={15} />
                        {new Date().toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })}
                        <ChevronDown size={13} />
                      </span>
                    )}
                  </div>
                )}
              {page === 'dashboard' && (
                <>
                  <div className="stat-grid">
                    <Stat
                      label="Total customers"
                      value={m.customers.toLocaleString()}
                      icon={Users}
                      note={`${m.enquiries} new enquiries to follow up`}
                      onClick={() => go('customers')}
                    />
                    <Stat
                      label="Confirmed orders"
                      value={m.orders.toLocaleString()}
                      icon={ShoppingBag}
                      note={`${s.orders.filter((o) => o.status === 'Confirmed').length} awaiting stock reservation`}
                      onClick={() => go('orders')}
                    />
                    <Stat
                      label="Installations completed"
                      value={m.completed.toLocaleString()}
                      icon={Sun}
                      note={`${m.pending} installations in the pipeline`}
                      onClick={() => go('installations')}
                    />
                    <Stat
                      label={
                        financeAccess ? 'Total revenue' : 'Open service tickets'
                      }
                      value={
                        financeAccess ? shortMoney(m.revenue) : String(m.open)
                      }
                      icon={financeAccess ? Wallet : Wrench}
                      note={
                        financeAccess
                          ? 'Approved order value • not payments'
                          : 'Customer care in progress'
                      }
                      onClick={() => go(financeAccess ? 'finance' : 'tickets')}
                    />
                  </div>
                  <div className="chart-grid">
                    <section className="panel revenue-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>
                            {financeAccess
                              ? 'Revenue & expenses'
                              : 'Customer enquiries'}
                          </h2>
                          <p>
                            {financeAccess
                              ? 'A clear view of your business performance'
                              : 'Your customer pipeline over the past six months'}
                          </p>
                        </div>
                        <select
                          aria-label="Chart period"
                          value={range}
                          onChange={(e) => setRange(e.target.value)}
                        >
                          <option>This Month</option>
                          <option>All Time</option>
                          <option>This Week</option>
                          <option>Today</option>
                        </select>
                      </div>
                      {financeAccess && (
                        <div className="chart-summary">
                          <div>
                            <span className="legend-dot green" />
                            Revenue<strong>{shortMoney(m.revenue)}</strong>
                          </div>
                          <div>
                            <span className="legend-dot yellow" />
                            Expenses<strong>{shortMoney(m.expenses)}</strong>
                          </div>
                          <div className="profit-label">
                            Net profit{' '}
                            <span>
                              {shortMoney(m.profit)} <ArrowUpRight size={14} />
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="area-chart">
                        <ResponsiveContainer width="100%" height={230}>
                          <AreaChart
                            data={
                              financeAccess
                                ? monthChart
                                : monthChart.map((r, i) => ({
                                    ...r,
                                    revenue: s.customers.filter(
                                      (c) =>
                                        new Date(c.createdAt).getMonth() ===
                                        (new Date().getMonth() - 5 + i + 12) %
                                          12,
                                    ).length,
                                    expenses: 0,
                                  }))
                            }
                            margin={{
                              top: 15,
                              right: 16,
                              left: -15,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="revFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#26876a"
                                  stopOpacity={0.16}
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#26876a"
                                  stopOpacity={0.01}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              vertical={false}
                              stroke="#edf0ee"
                              strokeDasharray="4 4"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#87928e', fontSize: 11 }}
                              dy={9}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#87928e', fontSize: 11 }}
                              tickFormatter={(n) =>
                                financeAccess
                                  ? n >= 100000
                                    ? '₹' + (n / 100000).toFixed(0) + 'L'
                                    : '₹' + n / 1000 + 'k'
                                  : n
                              }
                            />
                            <Tooltip
                              formatter={(v: any) =>
                                financeAccess ? money(v) : v
                              }
                              contentStyle={{
                                borderRadius: 10,
                                border: '1px solid #e5eae7',
                                fontSize: 12,
                              }}
                            />
                            <Area
                              name={financeAccess ? 'Revenue' : 'Enquiries'}
                              type="monotone"
                              dataKey="revenue"
                              stroke="#24856a"
                              strokeWidth={2.5}
                              fill="url(#revFill)"
                            />
                            {financeAccess && (
                              <Area
                                name="Expenses"
                                type="monotone"
                                dataKey="expenses"
                                stroke="#dfb34c"
                                strokeWidth={2}
                                strokeDasharray="5 4"
                                fill="transparent"
                              />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                    <section className="panel installation-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Installation overview</h2>
                          <p>Every rooftop, a step forward</p>
                        </div>
                        <button
                          className="icon-button"
                          aria-label="View installations"
                          onClick={() => go('installations')}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                      <div className="donut-wrap">
                        <ResponsiveContainer width="100%" height={185}>
                          <PieChart>
                            <Pie
                              data={installChart.filter((x) => x.value > 0)}
                              dataKey="value"
                              innerRadius={64}
                              outerRadius={80}
                              paddingAngle={5}
                              cornerRadius={5}
                              stroke="none"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {installChart
                                .filter((x) => x.value > 0)
                                .map((x) => (
                                  <Cell
                                    key={x.name}
                                    fill={
                                      color[
                                        [
                                          'Completed',
                                          'In Progress',
                                          'Scheduled',
                                          'Delayed',
                                        ].indexOf(x.name)
                                      ]
                                    }
                                  />
                                ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center">
                          <strong>{scoped.installations.length}</strong>
                          <span>Total installations</span>
                        </div>
                      </div>
                      <div className="donut-legend">
                        {installChart.map((x, i) => (
                          <div key={x.name}>
                            <span>
                              <i style={{ background: color[i] }} />
                              {x.name}
                            </span>
                            <strong>{x.value}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  <div className="operations-strip">
                    <button onClick={() => go('products')}>
                      <span className="strip-icon amber">
                        <Package size={19} />
                      </span>
                      <div>
                        <strong>{m.low} low-stock products</strong>
                        <span>Keep upcoming projects on track</span>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                    <button onClick={() => go('tickets')}>
                      <span className="strip-icon blue">
                        <Wrench size={19} />
                      </span>
                      <div>
                        <strong>{m.open} open service tickets</strong>
                        <span>A little attention goes a long way</span>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                    <button
                      onClick={() => go(financeAccess ? 'finance' : 'orders')}
                    >
                      <span className="strip-icon green">
                        <Clock size={19} />
                      </span>
                      <div>
                        <strong>
                          {financeAccess
                            ? shortMoney(m.outstanding) + ' outstanding'
                            : m.pending + ' pending installations'}
                        </strong>
                        <span>
                          {financeAccess
                            ? 'Customer payments to collect'
                            : 'Your next clean energy milestones'}
                        </span>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                  </div>
                  <div className="bottom-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>
                            Recent enquiries{' '}
                            <span className="count-pill">
                              {scoped.customers.length}
                            </span>
                          </h2>
                          <p>The next rooftops to go solar</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => go('customers')}
                        >
                          View all <ArrowRight size={14} />
                        </button>
                      </div>
                      {table(
                        'customers',
                        [
                          nameCol,
                          {
                            label: 'Requirement',
                            render: (r) => (
                              <>
                                {r.capacity} kW<small>{r.system}</small>
                              </>
                            ),
                          },
                          statusCol,
                        ],
                        scoped.customers
                          .slice()
                          .sort((a, b) =>
                            b.createdAt.localeCompare(a.createdAt),
                          )
                          .slice(0, 4),
                      )}
                    </section>
                    <section className="panel upcoming-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Upcoming installations</h2>
                          <p>Ready for a brighter tomorrow</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => go('installations')}
                        >
                          View all <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="upcoming-list">
                        {s.installations
                          .filter(
                            (i) =>
                              !['Completed', 'Cancelled'].includes(i.status),
                          )
                          .slice()
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .slice(0, 3)
                          .map((i) => (
                            <button
                              key={i.id}
                              onClick={() => view('installations', i)}
                            >
                              <span className="calendar-tile">
                                <small>
                                  {new Date(i.date).toLocaleDateString('en', {
                                    month: 'short',
                                  })}
                                </small>
                                <strong>{new Date(i.date).getDate()}</strong>
                              </span>
                              <div>
                                <strong>{customer(i.customerId)}</strong>
                                <span>
                                  {s.packages.find(
                                    (p) =>
                                      p.id ===
                                      s.orders.find((o) => o.id === i.orderId)
                                        ?.packageId,
                                  )?.name || 'Solar installation'}
                                </span>
                                <small>
                                  <UserRound size={12} />
                                  {i.assigned}
                                </small>
                              </div>
                              <Badge>{i.status}</Badge>
                            </button>
                          ))}
                        {!s.installations.some(
                          (i) => !['Completed', 'Cancelled'].includes(i.status),
                        ) && (
                          <div className="empty">
                            No upcoming installations.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                  <div className="solar-banner">
                    <div className="banner-sun">
                      <Sun size={35} />
                    </div>
                    <div>
                      <strong>
                        More rooftops. More clean energy. One connected team.
                      </strong>
                      <p>
                        Let SunFlow AI turn your daily operations into your next
                        big opportunity.
                      </p>
                    </div>
                    <button onClick={() => setChat(true)}>
                      Ask SunFlow AI <Sparkles size={16} />
                    </button>
                    <div className="banner-grid" />
                  </div>
                  <div className="bottom-grid supplemental">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Recent payments</h2>
                        <button
                          className="text-button"
                          onClick={() => go('orders')}
                        >
                          View orders <ArrowRight size={14} />
                        </button>
                      </div>
                      {table(
                        'payments',
                        [
                          nameCol,
                          {
                            label: 'Amount',
                            render: (r) =>
                              (r.type === 'Refund' ? '− ' : '') +
                              money(r.amount),
                          },
                          { label: 'Date', render: (r) => dateText(r.date) },
                        ],
                        scoped.payments.slice(-3).reverse(),
                      )}
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Open complaints</h2>
                        <button
                          className="text-button"
                          onClick={() => go('tickets')}
                        >
                          View tickets <ArrowRight size={14} />
                        </button>
                      </div>
                      {table(
                        'tickets',
                        [
                          {
                            label: 'Complaint',
                            render: (r) => <strong>{r.description}</strong>,
                          },
                          {
                            label: 'Priority',
                            render: (r) => <Badge>{r.priority}</Badge>,
                          },
                          statusCol,
                        ],
                        scoped.tickets
                          .filter((t) => t.status !== 'Closed')
                          .slice(0, 3),
                      )}
                    </section>
                  </div>
                </>
              )}
              {[
                'customers',
                'surveys',
                'quotations',
                'orders',
                'products',
                'installations',
                'warranties',
                'tickets',
              ].includes(page) && (
                <section className="panel module-panel">
                  {page === 'products' && (
                    <div className="module-tabs">
                      {[
                        'products',
                        'serials',
                        'packages',
                        'suppliers',
                        'movements',
                      ]
                        .filter((t) =>
                          permissions[user?.role || '']?.includes(t),
                        )
                        .map((t) => (
                          <button
                            className={tab === t ? 'selected' : ''}
                            onClick={() => {
                              setTab(t)
                              setFilter('All statuses')
                              setQuery('')
                            }}
                            key={t}
                          >
                            {titles[t]}
                          </button>
                        ))}
                      {canEdit('products') && (
                        <button
                          className="text-button push-right"
                          onClick={() => openForm('purchase')}
                        >
                          <Plus size={15} />
                          Receive stock
                        </button>
                      )}
                    </div>
                  )}
                  {filterBar}
                  {moduleContent()}
                </section>
              )}
              {page === 'finance' && (
                <>
                  <div className="stat-grid">
                    <Stat
                      label="Project revenue"
                      value={shortMoney(m.revenue)}
                      icon={Wallet}
                      note="Approved sales order values"
                    />
                    <Stat
                      label="Recognized project costs"
                      value={shortMoney(m.expenses)}
                      icon={ArrowDownRight}
                      note="Dispatched materials + recorded expenses"
                    />
                    <Stat
                      label="Project profit"
                      value={shortMoney(m.profit)}
                      icon={TrendingUp}
                      note="Revenue minus project costs"
                    />
                    <Stat
                      label="Outstanding payments"
                      value={shortMoney(m.outstanding)}
                      icon={Clock}
                      note="Sales value minus customer receipts"
                    />
                  </div>
                  <section className="panel module-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Project profitability</h2>
                        <p>
                          Payments are tracked separately and never counted
                          twice as revenue.
                        </p>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() =>
                          exportCsv(
                            scoped.orders.map((o) => {
                              const cost =
                                Number(o.materialCost || 0) +
                                s.expenses
                                  .filter((e) => e.orderId === o.id)
                                  .reduce((n, e) => n + e.amount, 0)
                              return {
                                order: o.number,
                                customer: customer(o.customerId),
                                revenue: o.total,
                                materialCost: o.materialCost,
                                projectCost: cost,
                                profit: o.total - cost,
                                margin: ((o.total - cost) / o.total) * 100,
                                outstanding: o.total - paid(o.id),
                                status: o.status,
                              }
                            }),
                            'project-profitability',
                          )
                        }
                      >
                        <Download size={15} />
                        Export report
                      </button>
                    </div>
                    {table(
                      'orders',
                      [
                        {
                          label: 'Project',
                          render: (r) => <strong>{r.number}</strong>,
                        },
                        nameCol,
                        { label: 'Revenue', render: (r) => money(r.total) },
                        {
                          label: 'Committed project cost',
                          render: (r) =>
                            money(
                              r.materialCost +
                                s.expenses
                                  .filter((e) => e.orderId === r.id)
                                  .reduce((n, e) => n + e.amount, 0),
                            ),
                        },
                        {
                          label: 'Projected profit / margin',
                          render: (r) => {
                            const profit =
                              r.total -
                              r.materialCost -
                              s.expenses
                                .filter((e) => e.orderId === r.id)
                                .reduce((n, e) => n + e.amount, 0)
                            return (
                              <strong
                                className={
                                  profit < 0 ? 'text-danger' : 'text-green'
                                }
                              >
                                {money(profit)}
                                <small>
                                  {((profit / r.total) * 100).toFixed(1)}%
                                  margin
                                </small>
                              </strong>
                            )
                          },
                        },
                        {
                          label: 'Outstanding',
                          render: (r) => money(r.total - paid(r.id)),
                        },
                      ],
                      scoped.orders,
                    )}
                  </section>
                  <div className="bottom-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Project & service expenses</h2>
                        <button
                          className="text-button"
                          onClick={() => exportCsv(scoped.expenses, 'expenses')}
                        >
                          Export CSV
                        </button>
                      </div>
                      {table(
                        'expenses',
                        [
                          {
                            label: 'Description',
                            render: (r) => <strong>{r.description}</strong>,
                          },
                          { label: 'Category', render: (r) => r.category },
                          {
                            label: 'Amount',
                            render: (r) =>
                              (r.type === 'Refund' ? '− ' : '') +
                              money(r.amount),
                          },
                        ],
                        scoped.expenses,
                      )}
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Supplier payables</h2>
                      </div>
                      {table(
                        'suppliers',
                        [
                          { label: 'Supplier', render: (r) => r.name },
                          {
                            label: 'Outstanding',
                            render: (r) => money(r.outstanding),
                          },
                        ],
                        s.suppliers,
                      )}
                    </section>
                  </div>
                </>
              )}
              {page === 'assistant' && (
                <Chat key={user?.role} full onClose={() => go('dashboard')} />
              )}
              {page === 'settings' && (
                <div className="settings-grid">
                  <section className="panel settings-card">
                    <h2>Organization & business rules</h2>
                    <p>
                      Configure company details, dispatch requirements,
                      quotation tax, and approved service guidance.
                    </p>
                    <div className="setting-row">
                      <span>Organization</span>
                      <strong>
                        {s.settings[0]?.name || 'SunPower Solutions'}
                      </strong>
                    </div>
                    {!user?.demo && (
                      <div className="setting-row">
                        <span>Organization ID for team access</span>
                        <strong className="mono">{user?.organizationId}</strong>
                      </div>
                    )}
                    <div className="setting-row">
                      <span>Minimum advance before dispatch</span>
                      <strong>{s.settings[0]?.advance ?? '—'}%</strong>
                    </div>
                    <div className="setting-row">
                      <span>Default quotation tax</span>
                      <strong>{s.settings[0]?.tax ?? '—'}%</strong>
                    </div>
                    {user?.role === 'Admin / Director' && s.settings[0] && (
                      <button
                        className="button"
                        onClick={() => openForm('settings', s.settings[0])}
                      >
                        Edit business settings
                      </button>
                    )}
                    <p className="muted">
                      Warranty durations are configured individually in
                      Inventory → Product. Package component quantities are
                      configured in Inventory → Solar packages.
                    </p>
                  </section>
                  <section className="panel settings-card">
                    <h2>
                      {user?.demo ? 'Demonstration workspace' : 'Team access'}
                    </h2>
                    {!user?.demo && user?.role === 'Admin / Director' && (
                      <>
                        <p className="muted">
                          Invite staff through the Identity panel, then assign
                          their role here using their user ID. Staff must sign
                          in again after access changes.
                        </p>
                        <button
                          className="button"
                          onClick={() => openForm('teamRole')}
                        >
                          Assign team access
                        </button>
                      </>
                    )}
                    <p>
                      {user?.demo
                        ? 'Sample records are fictional. Changes persist securely in your own database workspace for 30 days.'
                        : 'Roles are assigned by your administrator and enforced on the server.'}
                    </p>
                    {user?.demo && (
                      <>
                        <label className="field-label">
                          Explore a demo role
                          <select
                            value={user.role}
                            onChange={(e) =>
                              act(
                                'role',
                                { role: e.target.value },
                                'Demo role changed',
                              )
                            }
                          >
                            {roles.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </label>
                        <p className="muted">
                          All six role demos use this selector. Demo access is
                          password-free and isolated from live accounts.
                        </p>
                        {user.role === 'Admin / Director' && (
                          <button
                            className="button danger"
                            onClick={() => setResetConfirm(true)}
                          >
                            <RotateCcw size={16} />
                            Reset demo data
                          </button>
                        )}
                      </>
                    )}
                    <button
                      className="button secondary"
                      onClick={() => setShowLogin(true)}
                    >
                      <UserRound size={16} />
                      {user?.demo
                        ? 'Sign in to a live account'
                        : 'Manage your session'}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => go('overview')}
                    >
                      Project overview & demo checklist <ArrowRight size={15} />
                    </button>
                  </section>
                  {user?.role === 'Admin / Director' && (
                    <section className="panel audit-panel">
                      <div className="panel-heading">
                        <h2>Audit trail</h2>
                        <button
                          className="text-button"
                          onClick={() => exportCsv(s.audit, 'audit-trail')}
                        >
                          Export CSV
                        </button>
                      </div>
                      {table(
                        'audit',
                        [
                          {
                            label: 'Action',
                            render: (r) => <strong>{r.action}</strong>,
                          },
                          { label: 'Actor', render: (r) => r.actor },
                          { label: 'Role', render: (r) => r.role },
                          {
                            label: 'Date',
                            render: (r) =>
                              new Date(r.createdAt).toLocaleString(),
                          },
                          { label: 'Reason', render: (r) => r.reason || '—' },
                        ],
                        s.audit.slice(-30).reverse(),
                      )}
                    </section>
                  )}
                </div>
              )}
              {page === 'overview' && <Overview onNavigate={go} />}
            </>
          )}
          <footer>
            <span>
              © {new Date().getFullYear()} SunFlow AI{' '}
              <span className="footer-dot">•</span> Built for a brighter
              tomorrow.
            </span>
            <span>
              <span className="footer-dot green-dot" />{' '}
              {user?.demo
                ? 'Sample data • persistent demo workspace'
                : 'Secure connected workspace'}{' '}
              <Leaf size={13} />
            </span>
          </footer>
        </main>
      </div>
      {notifications && (
        <div className="notifications-popover">
          <div className="panel-heading">
            <h2>Needs your attention</h2>
            <button
              aria-label="Close notifications"
              className="icon-button"
              onClick={() => setNotifications(false)}
            >
              <X size={17} />
            </button>
          </div>
          <button
            onClick={() => {
              go('products')
              setNotifications(false)
            }}
          >
            <Package size={19} />
            <div>
              <strong>{m.low} low-stock products</strong>
              <small>Review stock before reserving new projects.</small>
            </div>
          </button>
          <button
            onClick={() => {
              go('tickets')
              setNotifications(false)
            }}
          >
            <Wrench size={19} />
            <div>
              <strong>{m.open} open service tickets</strong>
              <small>Review assignments and customer confirmations.</small>
            </div>
          </button>
        </div>
      )}
      {page !== 'assistant' && (
        <button className="floating-ai" onClick={() => setChat(!chat)}>
          <Sparkles size={19} />
          <span>Ask SunFlow AI</span>
          <span className="floating-key">↗</span>
        </button>
      )}
      {chat && page !== 'assistant' && (
        <div className="chat-floating">
          <Chat key={user?.role} onClose={() => setChat(false)} />
        </div>
      )}
      <FormModal
        modal={modal}
        busy={busy}
        onClose={() => !busy && setModal(null)}
        onSave={saveForm}
      />
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="detail-dialog">
          <DialogHeader>
            <DialogTitle>
              {detail ? titles[detail.kind] || detail.kind : ''} details
            </DialogTitle>
            <DialogDescription>
              Connected records and available workflow actions.
            </DialogDescription>
          </DialogHeader>
          {detail &&
            (() => {
              const { kind, row: r } = detail
              const w =
                kind === 'tickets'
                  ? s.warranties.find((w) => w.serialId === r.serialId)
                  : null
              const actions: any[] = []
              const button = (
                label: string,
                onClick: () => void,
                secondary = false,
              ) =>
                actions.push(
                  <button
                    key={label}
                    className={'button ' + (secondary ? 'secondary' : '')}
                    disabled={busy}
                    onClick={onClick}
                  >
                    {label}
                  </button>,
                )
              if (
                canEdit(kind) &&
                [
                  'customers',
                  'surveys',
                  'products',
                  'packages',
                  'suppliers',
                  'expenses',
                ].includes(kind)
              )
                button('Edit record', () => {
                  setDetail(null)
                  openForm(kind, r)
                })
              if (kind === 'customers') {
                if (canEdit('followups'))
                  button('Add follow-up', () => {
                    setDetail(null)
                    openForm('followups', undefined, {})
                    setModal((m) =>
                      m
                        ? {
                            ...m,
                            fields: m.fields.map((f) =>
                              f.key === 'customerId'
                                ? { ...f, value: r.id }
                                : f,
                            ),
                          }
                        : m,
                    )
                  })
                if (canEdit('surveys'))
                  button('Schedule survey', () => {
                    setDetail(null)
                    openForm('surveys')
                    setModal((m) =>
                      m
                        ? {
                            ...m,
                            fields: m.fields.map((f) =>
                              f.key === 'customerId'
                                ? { ...f, value: r.id }
                                : f,
                            ),
                          }
                        : m,
                    )
                  })
              }
              if (
                kind === 'surveys' &&
                ['Admin / Director', 'Survey Technician'].includes(
                  user?.role || '',
                )
              ) {
                const next: Record<string, string[]> = {
                  Scheduled: ['In Progress', 'Submitted'],
                  'In Progress': ['Submitted'],
                  Submitted: ['Approved', 'Rejected'],
                  Rejected: ['Scheduled'],
                }
                next[r.status]?.forEach((status) =>
                  button(
                    status === 'Approved' ? 'Approve survey' : status,
                    () => act('surveyStatus', { id: r.id, status }),
                  ),
                )
                if (r.status === 'Approved' && canEdit('quotations'))
                  button('Create quotation', () => {
                    setDetail(null)
                    openForm('quote')
                    setModal((m) =>
                      m
                        ? {
                            ...m,
                            fields: m.fields.map((f) =>
                              f.key === 'surveyId' ? { ...f, value: r.id } : f,
                            ),
                          }
                        : m,
                    )
                  })
              }
              if (kind === 'quotations') {
                button(
                  'Download PDF',
                  () => documentPdf('Quotation', r, s),
                  true,
                )
                button(
                  'Print quotation',
                  () => {
                    documentPdf('Quotation', r, s, true)
                  },
                  true,
                )
                if (canEdit('quotations')) {
                  const next: Record<string, string[]> = {
                    Draft: ['Sent', 'Rejected'],
                    Sent: ['Accepted', 'Rejected', 'Expired'],
                  }
                  next[r.status]?.forEach((status) =>
                    button(
                      status === 'Accepted'
                        ? 'Accept & create order'
                        : status === 'Sent'
                          ? 'Mark as sent'
                          : status,
                      () =>
                        act(
                          'quoteStatus',
                          { id: r.id, status },
                          status === 'Accepted'
                            ? 'Quotation accepted and sales order created'
                            : 'Quotation updated',
                        ),
                    ),
                  )
                }
              }
              if (kind === 'orders') {
                if (canEdit('payments') && paid(r.id) < r.total)
                  button('Record payment', () => {
                    setDetail(null)
                    openForm('payment')
                    setModal((m) =>
                      m
                        ? {
                            ...m,
                            fields: m.fields.map((f) =>
                              f.key === 'orderId'
                                ? { ...f, value: r.id }
                                : f.key === 'amount'
                                  ? { ...f, value: r.total - paid(r.id) }
                                  : f,
                            ),
                          }
                        : m,
                    )
                  })
                if (canEdit('serials') && r.status === 'Confirmed')
                  button('Reserve inventory', () =>
                    act(
                      'reserve',
                      { id: r.id },
                      'Inventory reserved for this order',
                    ),
                  )
                if (canEdit('serials') && r.status === 'Reserved')
                  button('Dispatch equipment', () => {
                    setDetail(null)
                    openForm('dispatch', r)
                  })
                if (canEdit('installations') && r.status !== 'Completed')
                  button('Schedule installation', () => {
                    setDetail(null)
                    openForm('schedule')
                    setModal((m) =>
                      m
                        ? {
                            ...m,
                            fields: m.fields.map((f) =>
                              f.key === 'orderId' ? { ...f, value: r.id } : f,
                            ),
                          }
                        : m,
                    )
                  })
                button(
                  'Download order / invoice',
                  () => documentPdf('Sales invoice', r, s),
                  true,
                )
              }
              if (kind === 'orders' && canEdit('quotations'))
                button(
                  'Subsidy paperwork',
                  () => {
                    setDetail(null)
                    openForm('subsidy', r)
                  },
                  true,
                )
              if (
                kind === 'orders' &&
                r.status === 'Dispatched' &&
                canEdit('serials')
              )
                button(
                  'Confirm delivery',
                  () => {
                    setDetail(null)
                    openForm('delivery', r)
                  },
                  true,
                )
              if (
                kind === 'suppliers' &&
                canEdit('suppliers') &&
                r.outstanding > 0
              )
                button('Record supplier payment', () => {
                  setDetail(null)
                  openForm('supplierPayment', r)
                })
              if (
                kind === 'orders' &&
                user?.role === 'Admin / Director' &&
                paid(r.id) > 0
              )
                button(
                  'Record refund',
                  () => {
                    setDetail(null)
                    openForm('refund', r)
                  },
                  true,
                )
              if (kind === 'payments')
                button('Download receipt', () =>
                  documentPdf('Payment receipt', r, s),
                )
              if (kind === 'packages' && user?.role === 'Admin / Director')
                button('Add BOM component', () => {
                  setDetail(null)
                  openForm('bom', r)
                })
              if (kind === 'installations' && canEdit('installations')) {
                if (['Scheduled', 'Delayed'].includes(r.status))
                  button('Start installation', () =>
                    act('installStatus', { id: r.id, status: 'In Progress' }),
                  )
                if (r.status === 'Scheduled')
                  button(
                    'Mark delayed',
                    () => act('installStatus', { id: r.id, status: 'Delayed' }),
                    true,
                  )
                if (r.status === 'In Progress')
                  button('Complete & activate warranties', () => {
                    setDetail(null)
                    openForm('complete', r)
                  })
                if (r.status === 'Completed')
                  button('Completion report PDF', () =>
                    documentPdf('Installation completion report', r, s),
                  )
              }
              if (kind === 'warranties' && user?.role === 'Admin / Director')
                button(
                  'Correct dates with audit reason',
                  () => {
                    setDetail(null)
                    openForm('warrantyCorrect', r)
                  },
                  true,
                )
              if (kind === 'tickets' && canEdit('tickets')) {
                if (!['Resolved', 'Closed'].includes(r.status))
                  button(
                    'Replace equipment',
                    () => {
                      setDetail(null)
                      openForm('replaceEquipment', r)
                    },
                    true,
                  )
                if (user?.role === 'Admin / Director')
                  button(
                    'Record coverage exception',
                    () => {
                      setDetail(null)
                      openForm('coverageException', r)
                    },
                    true,
                  )
                const next: Record<string, string[]> = {
                  Open: ['Assigned'],
                  Assigned: ['In Progress'],
                  'In Progress': ['Waiting for Parts', 'Resolved'],
                  'Waiting for Parts': ['In Progress'],
                  Resolved: ['Closed', 'In Progress'],
                }
                next[r.status]?.forEach((status) =>
                  button(
                    status === 'Closed'
                      ? 'Customer acceptance & close'
                      : status,
                    () => {
                      setDetail(null)
                      openForm('ticketStatus', r, { status })
                    },
                  ),
                )
                button(
                  'Service invoice PDF',
                  () =>
                    documentPdf(
                      'Service invoice',
                      { ...r, amount: r.parts + r.labour },
                      s,
                    ),
                  true,
                )
              }
              return (
                <div className="record-details">
                  <div className="detail-title">
                    <div>
                      <h2>
                        {r.name ||
                          r.number ||
                          r.serial ||
                          customer(r.customerId) ||
                          'Record'}
                      </h2>
                      <p>
                        {r.customerId
                          ? customer(r.customerId)
                          : r.category || ''}
                      </p>
                    </div>
                    {r.status && <Badge>{r.status}</Badge>}
                  </div>
                  {kind === 'orders' && (
                    <div className="detail-summary">
                      <div>
                        <small>Order total</small>
                        <strong>{money(r.total)}</strong>
                      </div>
                      <div>
                        <small>Received</small>
                        <strong>{money(paid(r.id))}</strong>
                      </div>
                      <div>
                        <small>Balance</small>
                        <strong>{money(r.total - paid(r.id))}</strong>
                      </div>
                    </div>
                  )}
                  {kind === 'tickets' && (
                    <div className="coverage-box">
                      <ShieldCheck size={22} />
                      <div>
                        <strong>
                          {w && w.status === 'Active' && w.expiry >= today()
                            ? 'Eligible warranty coverage • parts and labour covered'
                            : 'Warranty not active • paid service applies'}
                        </strong>
                        <p>
                          {w
                            ? 'Coverage ends ' + dateText(w.expiry)
                            : 'No active warranty record'}{' '}
                          • Estimated charges:{' '}
                          {money((r.parts || 0) + (r.labour || 0))}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="detail-fields">
                    {Object.entries(r)
                      .filter(
                        ([k, v]) =>
                          ![
                            'id',
                            'items',
                            'components',
                            'photos',
                            'createdAt',
                            'updatedAt',
                          ].includes(k) &&
                          !k.endsWith('Id') &&
                          typeof v !== 'object',
                      )
                      .map(([k, v]) => (
                        <div key={k}>
                          <span>{k.replace(/([A-Z])/g, ' $1')}</span>
                          <strong>
                            {typeof v === 'boolean'
                              ? v
                                ? 'Yes'
                                : 'No'
                              : String(v ?? '—')}
                          </strong>
                        </div>
                      ))}
                  </div>
                  {r.photos?.length > 0 && (
                    <div className="photo-grid">
                      {r.photos.map((key: string) => (
                        <a
                          href={'/api/files?key=' + encodeURIComponent(key)}
                          key={key}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={'/api/files?key=' + encodeURIComponent(key)}
                            alt="Recorded site photograph"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {r.items && (
                    <div className="bom-table">
                      <h3>Approved components</h3>
                      {r.items.map((x: any) => (
                        <div key={x.productId}>
                          <span>
                            {x.name} × {x.quantity}
                          </span>
                          <strong>{money(x.quantity * x.price)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.components && (
                    <div className="bom-table">
                      <h3>Configured Bill of Materials</h3>
                      <p className="muted">
                        An authorized engineer must approve component quantities
                        before real-world use.
                      </p>
                      {r.components.map((x: any) => (
                        <div key={x.productId}>
                          <span>
                            {product(x.productId)} × {x.quantity}
                          </span>
                          {user?.role === 'Admin / Director' && (
                            <button
                              className="text-button"
                              onClick={() =>
                                act(
                                  'bom',
                                  {
                                    id: r.id,
                                    components: r.components.filter(
                                      (c: any) => c.productId !== x.productId,
                                    ),
                                  },
                                  'BOM updated',
                                )
                              }
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {!r.components.length && (
                        <p>
                          No components configured. Add an engineer-approved BOM
                          to enable quotations.
                        </p>
                      )}
                    </div>
                  )}
                  {kind === 'orders' && r.status === 'Reserved' && (
                    <div className="bom-table">
                      <h3>Reserved serials for dispatch</h3>
                      {s.serials
                        .filter(
                          (sn) =>
                            sn.orderId === r.id && sn.status === 'Reserved',
                        )
                        .map((sn) => (
                          <div key={sn.id}>
                            <span>{product(sn.productId)}</span>
                            <strong className="mono">{sn.serial}</strong>
                          </div>
                        ))}
                    </div>
                  )}
                  {kind === 'customers' && (
                    <div className="history">
                      <h3>Customer history</h3>
                      {[
                        ...s.followups
                          .filter((x) => x.customerId === r.id)
                          .map((x) => ({
                            id: x.id,
                            text: x.notes,
                            date: x.date,
                          })),
                        ...s.surveys
                          .filter((x) => x.customerId === r.id)
                          .map((x) => ({
                            id: x.id,
                            text: 'Site survey • ' + x.status,
                            date: x.date,
                          })),
                        ...s.orders
                          .filter((x) => x.customerId === r.id)
                          .map((x) => ({
                            id: x.id,
                            text: x.number + ' • ' + x.status,
                            date: x.createdAt,
                          })),
                      ]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((x) => (
                          <div key={x.id}>
                            <span>{dateText(x.date)}</span>
                            <p>{x.text}</p>
                          </div>
                        ))}
                    </div>
                  )}
                  {kind === 'serials' && (
                    <div className="history">
                      <h3>Equipment service history</h3>
                      {s.tickets
                        .filter((t) => t.serialId === r.id)
                        .map((t) => (
                          <div key={t.id}>
                            <span>{dateText(t.date)}</span>
                            <p>
                              {t.description} • {t.status}
                              <br />
                              {t.notes}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="detail-actions">{actions}</div>
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="login-dialog">
          <DialogHeader>
            <DialogTitle>Welcome to SunFlow AI</DialogTitle>
            <DialogDescription>
              Sign in to your live workspace or explore a role in your isolated
              demo.
            </DialogDescription>
          </DialogHeader>
          <p className="muted">
            {user.name} · {user.role}
          </p>
          <button
            className="button secondary"
            onClick={async () => {
              try {
                await request('endSession')
                await logout()
                sessionStorage.removeItem('sunflow-chat')
                setS(empty())
                setUser(null)
                setShowLogin(false)
                setError('')
                go('login')
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : 'Unable to sign out.',
                )
              }
            }}
          >
            <LogOut size={16} />
            {user.demo ? 'Exit demo / Log in' : 'Log out'}
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your demonstration workspace?</DialogTitle>
            <DialogDescription>
              This replaces all changes in this demo with the original fictional
              sample records. Live workspaces are unaffected.
            </DialogDescription>
          </DialogHeader>
          <div className="detail-actions">
            <button
              className="button secondary"
              onClick={() => setResetConfirm(false)}
            >
              Keep my changes
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                if (await act('reset', {}, 'Demo records restored'))
                  setResetConfirm(false)
              }}
            >
              Reset demo data
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
function Stat({
  label,
  value,
  icon: Icon,
  note,
  onClick,
}: {
  label: string
  value: string
  icon: any
  note: string
  onClick?: () => void
}) {
  return (
    <button className="stat-card" onClick={onClick} disabled={!onClick}>
      <div className="stat-label">
        {label}
        <span>
          <Icon size={19} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="stat-note">
        <span className="tiny-dot" />
        {note}
      </div>
    </button>
  )
}
function FormModal({
  modal,
  busy,
  onClose,
  onSave,
}: {
  modal: Modal | null
  busy: boolean
  onClose: () => void
  onSave: (v: any) => Promise<any>
}) {
  const [values, setValues] = useState<Record<string, any>>({}),
    [uploading, setUploading] = useState(false),
    [formError, setFormError] = useState(''),
    [scanning, setScanning] = useState(false)
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    if (timer.current) clearTimeout(timer.current)
    setScanning(false)
  }
  useEffect(() => {
    if (modal) {
      setValues(
        Object.fromEntries(
          modal.fields.map((f) => [
            f.key,
            f.type === 'file' ? f.value || [] : f.value,
          ]),
        ),
      )
      setFormError('')
    }
    return () => {
      stream.current?.getTracks().forEach((t) => t.stop())
      if (timer.current) clearTimeout(timer.current)
    }
  }, [modal])
  const set = (key: string, value: any) =>
    setValues((v) => ({ ...v, [key]: value }))
  async function upload(files: FileList | null, key: string) {
    if (!files) return
    setUploading(true)
    setFormError('')
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/files', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        uploaded.push(data.key)
      }
      setValues((v) => ({
        ...v,
        [key]: [...(Array.isArray(v[key]) ? v[key] : []), ...uploaded],
      }))
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }
  async function scan() {
    try {
      if (!('BarcodeDetector' in window))
        throw new Error(
          'Camera scanning is not supported in this browser. Enter serial numbers manually.',
        )
      setScanning(true)
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      if (!video.current)
        throw new Error('Camera unavailable. Use manual serial entry.')
      video.current.srcObject = stream.current
      await video.current.play()
      const detector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'ean_13'],
      })
      const detect = async () => {
        if (video.current && stream.current?.active) {
          try {
            const codes = await detector.detect(video.current)
            for (const code of codes)
              setValues((v) => {
                const existing = String(v.serials || '').split('\n')
                return {
                  ...v,
                  serials: existing.includes(code.rawValue)
                    ? v.serials
                    : [...existing, code.rawValue].filter(Boolean).join('\n'),
                }
              })
          } catch {}
          timer.current = setTimeout(detect, 600)
        }
      }
      detect()
    } catch (e) {
      stop()
      setFormError(
        e instanceof Error
          ? e.message
          : 'Camera unavailable. Enter serials manually.',
      )
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    for (const f of modal!.fields) {
      if (
        f.required &&
        (f.type === 'file'
          ? !values[f.key]?.length
          : f.type === 'checkbox'
            ? !values[f.key]
            : values[f.key] === '' || values[f.key] == null)
      ) {
        setFormError(`${f.label} is required.`)
        return
      }
    }
    const clean = { ...values }
    modal!.fields
      .filter((f) => f.type === 'number')
      .forEach((f) => (clean[f.key] = Number(values[f.key])))
    await onSave(clean)
  }
  return (
    <Dialog
      open={!!modal}
      onOpenChange={(o) => {
        if (!o) {
          stop()
          onClose()
        }
      }}
    >
      <DialogContent className="form-dialog">
        <DialogHeader>
          <DialogTitle>{modal?.title}</DialogTitle>
          <DialogDescription>
            {modal?.description ||
              'Save changes to your connected SunFlow workspace.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="form-grid">
            {modal?.fields.map((f) => (
              <label
                className={
                  'field-label ' +
                  (['textarea', 'file', 'checkbox'].includes(f.type || '')
                    ? 'wide'
                    : '')
                }
                key={f.key}
              >
                {f.type !== 'checkbox' && (
                  <span>
                    {f.label}
                    {f.required && <b> *</b>}
                  </span>
                )}
                {f.type === 'select' ? (
                  <select
                    value={values[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    required={f.required}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={values[f.key] || ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    required={f.required}
                  />
                ) : f.type === 'checkbox' ? (
                  <span className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!values[f.key]}
                      onChange={(e) => set(f.key, e.target.checked)}
                      required={f.required}
                    />
                    {f.label}
                    {f.required && ' *'}
                  </span>
                ) : f.type === 'file' ? (
                  <>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => upload(e.target.files, f.key)}
                    />
                    <small>
                      {uploading
                        ? 'Uploading securely…'
                        : `${Array.isArray(values[f.key]) ? values[f.key].length : 0} photograph(s) attached. JPG, PNG or WebP • up to 4 MB each.`}
                    </small>
                  </>
                ) : (
                  <input
                    type={f.type || 'text'}
                    min={f.type === 'number' ? 0 : undefined}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={values[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    required={f.required}
                  />
                )}
              </label>
            ))}
          </div>
          {modal?.action === 'dispatch' && (
            <div className="scanner">
              <button
                type="button"
                className="button secondary"
                onClick={scanning ? stop : scan}
              >
                <Camera size={16} />
                {scanning ? 'Stop camera' : 'Scan QR / barcode'}
              </button>
              {scanning && <video ref={video} autoPlay playsInline muted />}
            </div>
          )}
          {formError && (
            <div className="form-error" role="alert">
              {formError}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy || uploading}
              onClick={() => {
                stop()
                onClose()
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button"
              disabled={busy || uploading}
            >
              {busy || uploading ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Check size={17} />
              )}{' '}
              {busy ? 'Saving…' : uploading ? 'Uploading…' : 'Save & continue'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function Chat({
  onClose,
  full = false,
}: {
  onClose: () => void
  full?: boolean
}) {
  const [messages, setMessages] = useState<
      { role: 'user' | 'assistant'; content: string }[]
    >([]),
    [input, setInput] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const stored = sessionStorage.getItem('sunflow-chat')
    if (stored)
      try {
        setMessages(JSON.parse(stored))
      } catch {}
  }, [])
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])
  async function send(text: string) {
    if (!text.trim() || loading) return
    const next = [...messages, { role: 'user' as const, content: text.trim() }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-24) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const all = [
        ...next,
        { role: 'assistant' as const, content: data.message },
      ]
      setMessages(all)
      sessionStorage.setItem('sunflow-chat', JSON.stringify(all))
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'AI unavailable. Use module search to continue.',
      )
    } finally {
      setLoading(false)
    }
  }
  return (
    <section className={'chat-panel ' + (full ? 'full-chat' : '')}>
      <div className="chat-header">
        <span className="chat-icon">
          <Sparkles size={21} />
        </span>
        <div>
          <h2>SunFlow AI Assistant</h2>
          <p>Your business. A little clearer.</p>
        </div>
        <button
          className="icon-button"
          aria-label="Clear conversation"
          onClick={() => {
            setMessages([])
            setError('')
            sessionStorage.removeItem('sunflow-chat')
          }}
        >
          <RotateCcw size={16} />
        </button>
        {!full && (
          <button
            className="icon-button"
            aria-label="Close assistant"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        )}
      </div>
      <div className="chat-messages">
        {!messages.length && (
          <div className="chat-welcome">
            <div className="welcome-icon">
              <Sparkles size={28} />
            </div>
            <h3>A brighter perspective.</h3>
            <p>
              Ask about your projects, customers, inventory, or performance.
              Answers use records your role can access.
            </p>
            {[
              'What needs my attention today?',
              'Summarize upcoming installations',
              'Which products are low in stock?',
              'Explain warranty coverage',
            ].map((p) => (
              <button key={p} onClick={() => send(p)}>
                {p}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div className={'chat-message ' + m.role} key={i}>
            {m.role === 'assistant' && <Sparkles size={16} />}
            <p>{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="chat-thinking">
            <LoaderCircle size={16} className="spin" /> Checking your authorized
            records…
          </div>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div ref={bottom} />
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          aria-label="Message SunFlow AI"
          placeholder="Ask about your solar business…"
          value={input}
          maxLength={4000}
          onChange={(e) => setInput(e.target.value)}
        />
        <button aria-label="Send message" disabled={loading || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
      <p className="chat-disclaimer">
        Read-only assistance. Verify important details in the linked modules.
      </p>
    </section>
  )
}
function Overview({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="overview">
      <section className="overview-hero">
        <span className="eyebrow">ONE PLATFORM. EVERY ROOFTOP.</span>
        <h2>
          From scattered messages
          <br />
          to a connected solar business.
        </h2>
        <p>
          SunPower Solutions brings enquiries, sales, warehouse operations,
          installation crews, and long-term service together in SunFlow AI.
        </p>
        <button className="button" onClick={() => onNavigate('customers')}>
          Start the workflow <ArrowRight size={16} />
        </button>
        <Sun className="overview-sun" size={180} />
      </section>
      <div className="bottom-grid">
        <section className="panel settings-card">
          <h2>Your 5–7 minute demonstration</h2>
          <ol className="demo-checklist">
            {[
              [
                'customers',
                'Create a customer enquiry',
                'Use a unique fictional phone number.',
              ],
              [
                'surveys',
                'Schedule, submit, and approve a survey',
                'Switch to Survey Technician to approve.',
              ],
              [
                'quotations',
                'Generate and accept a quotation',
                'Select the configured 3 kW On-Grid demo package.',
              ],
              [
                'orders',
                'Record advance payment',
                'Meet the configured 40% minimum.',
              ],
              [
                'products',
                'Reserve and dispatch equipment',
                'Open the order as Admin; copy the reserved serials.',
              ],
              [
                'installations',
                'Start and complete the installation',
                'Upload a photo, complete checks, and record acceptance.',
              ],
              [
                'warranties',
                'Verify automatic warranty activation',
                'Equipment coverage starts on completion.',
              ],
              [
                'tickets',
                'Raise and resolve a service ticket',
                'Covered equipment has zero parts and labour charges.',
              ],
              [
                'finance',
                'Review project profitability',
                'Check order revenue, material costs, and labour.',
              ],
            ].map(([p, t, d], i) => (
              <li key={p}>
                <button onClick={() => onNavigate(p)}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <div>
                    <strong>{t}</strong>
                    <span>{d}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel settings-card">
          <h2>Built around your operations</h2>
          <div className="feature-list">
            {[
              [
                Users,
                'One customer history',
                'Enquiries, surveys, orders, equipment, and follow-ups stay linked.',
              ],
              [
                Package,
                'Traceable equipment',
                'Unique serials, reserved stock, payment-gated dispatch, and installed asset registers.',
              ],
              [
                ShieldCheck,
                'Care beyond completion',
                'Configurable product warranties and customer-confirmed service closure.',
              ],
              [
                ChartNoAxesCombined,
                'Numbers you can explain',
                'Order values, recorded payments, material costs, and project margins.',
              ],
              [
                Sparkles,
                'AI with business context',
                'Read-only assistance grounded in records available to the current role.',
              ],
            ].map(([Icon, t, d]) => {
              const I = Icon as any
              return (
                <div key={String(t)}>
                  <span>
                    <I size={21} />
                  </span>
                  <div>
                    <strong>{String(t)}</strong>
                    <p>{String(d)}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="demo-notice">
            <Info size={19} />
            <p>
              Demo package quantities and product warranties are sample
              configuration, not engineering recommendations or manufacturer
              guarantees.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
