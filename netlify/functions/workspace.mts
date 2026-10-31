import type { Context } from '@netlify/functions'
import { session, workspace, sameOrigin } from '../../server/store'
import { mutate } from '../../server/engine'
import { admin, getUser } from '@netlify/identity'
import { visible, roles, make } from '../../shared/domain'
export default async (req: Request, context: Context) => {
  try {
    sameOrigin(req)
    let action = '',
      payload: any = {}
    if (req.method === 'POST') ({ action, payload = {} } = await req.json())
    else if (req.method !== 'GET')
      return new Response('Method not allowed', { status: 405 })
    const user = await session(context, action === 'startDemo')
    if (action === 'endSession') {
      context.cookies.delete('sunflow_demo', { path: '/' })
      context.cookies.delete('sunflow_role', { path: '/' })
      return Response.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    const photos = payload.photos || payload.data?.photos
    if (
      photos &&
      (!Array.isArray(photos) ||
        photos.some(
          (key: any) =>
            typeof key !== 'string' ||
            !key.startsWith(user.organizationId + '/'),
        ))
    )
      throw new Error('Photographs must belong to your workspace.')
    if (action === 'role') {
      if (!user.demo || !roles.includes(payload.role))
        throw new Error('Role switching is available only for demo accounts.')
      user.role = payload.role
      context.cookies.set({
        name: 'sunflow_role',
        value: payload.role,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 2592000,
      })
    }
    if (action === 'teamRole') {
      if (
        user.demo ||
        user.role !== 'Admin / Director' ||
        !roles.includes(payload.role)
      )
        throw new Error(
          'Live administrator access and a valid role are required.',
        )
      const current = await getUser()
      if (payload.userId === current?.id)
        throw new Error('Ask another administrator to change your own access.')
      const target = await admin.getUser(String(payload.userId))
      if (
        target.appMetadata?.organization_id &&
        target.appMetadata.organization_id !== user.organizationId
      )
        throw new Error('This account belongs to another organization.')
      await admin.updateUser(target.id, {
        app_metadata: {
          ...target.appMetadata,
          organization_id: user.organizationId,
          roles: [payload.role],
        },
      })
    }
    if (action === 'reset' && user.role !== 'Admin / Director')
      throw new Error('Administrator access required.')
    const { state, result } = await workspace(
      user,
      (s) =>
        action === 'teamRole'
          ? s.audit.push(
              make({
                actor: user.name,
                role: user.role,
                action: 'teamRole',
                recordId: payload.userId,
                assignedRole: payload.role,
              }),
            )
          : action && !['role', 'reset', 'startDemo'].includes(action)
            ? mutate(s, user.role, action, payload, user.name)
            : null,
      action === 'reset',
    )
    return Response.json(
      {
        state: visible(state, user.role),
        user,
        resultId:
          typeof result === 'object' && result ? (result as any).id : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unable to process request.' },
      {
        status:
          e instanceof Error && e.message.startsWith('Authentication required')
            ? 401
            : 400,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }
}
export const config = { path: '/api/workspace' }
