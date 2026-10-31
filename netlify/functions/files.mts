import type { Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { session, sameOrigin } from '../../server/store'
export default async (req: Request, context: Context) => {
  try {
    sameOrigin(req)
    const user = await session(context)
    const store = getStore('sunflow-private-files')
    if (req.method === 'POST') {
      if (
        ![
          'Admin / Director',
          'Survey Technician',
          'Installation Technician',
        ].includes(user.role)
      )
        return new Response('Forbidden', { status: 403 })
      const form = await req.formData()
      const file = form.get('file')
      if (
        !(file instanceof File) ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 4 * 1024 * 1024
      )
        throw new Error('Upload a JPG, PNG, or WebP photograph up to 4 MB.')
      const key = `${user.organizationId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`
      await store.set(key, await file.arrayBuffer())
      return Response.json({ key })
    }
    if (req.method === 'GET') {
      const key = new URL(req.url).searchParams.get('key') || ''
      if (!key.startsWith(user.organizationId + '/'))
        return new Response('Forbidden', { status: 403 })
      const data = await store.get(key, { type: 'arrayBuffer' })
      if (!data) return new Response('Not found', { status: 404 })
      return new Response(data as ArrayBuffer, {
        headers: {
          'Content-Type': key.endsWith('.png')
            ? 'image/png'
            : key.endsWith('.webp')
              ? 'image/webp'
              : 'image/jpeg',
          'Cache-Control': 'private, max-age=300',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    return new Response('Method not allowed', { status: 405 })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
export const config = { path: '/api/files' }
