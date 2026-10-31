import { createHash, randomBytes } from 'node:crypto'
import { getDatabase } from '@netlify/database'
import { getUser } from '@netlify/identity'
import { eq } from 'drizzle-orm'
import { database } from '../db'
import { organizations, profiles } from '../db/schema'
import { collections, empty, roles, type State } from '../shared/domain'
import { seed } from '../shared/seed'
import { relations } from './relations'
import type { Context } from '@netlify/functions'
export type Session = {
  organizationId: string
  role: string
  demo: boolean
  name: string
}
export async function session(
  context: Context,
  startDemo = false,
): Promise<Session> {
  const user = await getUser()
  if (user) {
    const u = user as any
    await database()
      .insert(profiles)
      .values({
        id: u.id,
        email: u.email || '',
        fullName: u.userMetadata?.full_name || u.name || '',
        companyName: u.userMetadata?.company_name || '',
        phone: u.userMetadata?.phone || '',
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email: u.email || '',
          fullName: u.userMetadata?.full_name || u.name || '',
          companyName: u.userMetadata?.company_name || '',
          phone: u.userMetadata?.phone || '',
          updatedAt: new Date(),
        },
      })
    const assignedRoles = [...(u.roles || []), ...(u.appMetadata?.roles || [])]
    const role = roles.find(
      (r) =>
        assignedRoles.includes(r) ||
        (r === 'Admin / Director' && assignedRoles.includes('admin')),
    )
    const org =
      u.appMetadata?.organization_id ||
      (role === 'Admin / Director' ? u.id : null)
    if (!role || !/^[-0-9a-f]{36}$/i.test(org || ''))
      throw new Error(
        'Your account needs a role and organization assignment from an administrator.',
      )
    if (role === 'Admin / Director')
      await database()
        .insert(organizations)
        .values({ id: org, name: 'SunPower Solutions', kind: 'live' })
        .onConflictDoNothing()
    return { organizationId: org, role, demo: false, name: u.name || u.email }
  }
  let token = context.cookies.get('sunflow_demo')
  if (!/^[a-f0-9]{64}$/.test(token || '')) {
    if (!startDemo)
      throw new Error('Authentication required. Sign in or choose Try Demo.')
    token = randomBytes(32).toString('hex')
    context.cookies.set({
      name: 'sunflow_demo',
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  const hash = createHash('sha256').update(token!).digest('hex')
  const db = database()
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.sessionHash, hash))
  if (!org) {
    const [created] = await db
      .insert(organizations)
      .values({
        name: 'SunPower Solutions • Demo',
        sessionHash: hash,
        kind: 'demo',
      })
      .returning()
    org = created
  }
  const cookieRole = context.cookies.get('sunflow_role')
  return {
    organizationId: org.id,
    role: roles.includes(cookieRole || '') ? cookieRole! : 'Admin / Director',
    demo: true,
    name: 'Aarav Singh',
  }
}
export async function workspace<T>(
  session: Session,
  fn: (s: State) => Promise<T> | T,
  reset = false,
): Promise<{ state: State; result: T }> {
  const client = await getDatabase().pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      session.organizationId,
    ])
    await client.query("SELECT set_config('app.organization_id',$1,true)", [
      session.organizationId,
    ])
    const s = empty()
    for (const k of collections) {
      const r = await client.query(
        `SELECT data FROM "${k}" WHERE organization_id=$1`,
        [session.organizationId],
      )
      s[k] = r.rows.map((x: any) => x.data)
    }
    const initial = Object.fromEntries(
      collections.map((k) => [
        k,
        new Map(s[k].map((r) => [r.id, JSON.stringify(r)])),
      ]),
    ) as Record<string, Map<string, string>>
    if (reset) {
      if (!session.demo)
        throw new Error('Reset is available only in demo mode.')
      for (const k of [...collections].reverse())
        await client.query(`DELETE FROM "${k}" WHERE organization_id=$1`, [
          session.organizationId,
        ])
      for (const k of collections) initial[k].clear()
      Object.assign(s, seed())
    } else if (!s.settings.length) {
      if (session.demo) Object.assign(s, seed())
      else {
        s.settings.push({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: 'SunPower Solutions',
          advance: 40,
          tax: 5,
          knowledge: '',
        })
      }
    }
    const result = await fn(s)
    for (const k of collections) {
      for (const row of s[k]) {
        if (initial[k].get(row.id) === JSON.stringify(row)) continue
        row.updatedAt = new Date().toISOString()
        const refs = Object.keys(relations[k] || {})
        const vals: any[] = [
          row.id,
          session.organizationId,
          JSON.stringify(row),
          row.createdAt,
          row.updatedAt,
          ...refs.map((c) => row[c.replace('_id', 'Id')] || null),
        ]
        const cols = [
          'id',
          'organization_id',
          'data',
          'created_at',
          'updated_at',
          ...refs,
        ]
        await client.query(
          `INSERT INTO "${k}" (${cols.join(',')}) VALUES (${vals.map((_, i) => '$' + (i + 1)).join(',')}) ON CONFLICT(id) DO UPDATE SET ${cols
            .filter((c) => c !== 'id' && c !== 'created_at')
            .map((c) => `${c}=EXCLUDED.${c}`)
            .join(',')}`,
          vals,
        )
      }
    }
    await client.query('COMMIT')
    return { state: s, result }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
export function sameOrigin(req: Request) {
  if (
    req.method === 'POST' &&
    req.headers.get('origin') !== new URL(req.url).origin
  )
    throw new Error('Request origin is not permitted.')
}
