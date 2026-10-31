import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUser } from '@netlify/identity'
import { session } from '../../server/store'
vi.mock('@netlify/identity', () => ({ getUser: vi.fn() }))
const persist = vi.hoisted(() => ({ insert: vi.fn() }))
vi.mock('../../db', () => ({ database: () => persist }))
beforeEach(() => vi.clearAllMocks())
describe('Server authentication boundary', () => {
  it('rejects anonymous access without silently creating a demo', async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    const context = { cookies: { get: vi.fn(), set: vi.fn() } }
    await expect(session(context as any)).rejects.toThrow(
      'Authentication required',
    )
    expect(context.cookies.set).not.toHaveBeenCalled()
    expect(persist.insert).not.toHaveBeenCalled()
  })
  it('does not grant a role from self-service signup metadata', async () => {
    vi.mocked(getUser).mockResolvedValue({
      id: '5d58448c-02fb-4cdf-a1f6-e04b98cfd25e',
      email: 'staff@example.test',
      userMetadata: {
        roles: ['admin'],
        organization_id: '5d58448c-02fb-4cdf-a1f6-e04b98cfd25e',
      },
    })
    persist.insert.mockReturnValue({
      values: () => ({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    })
    await expect(session({ cookies: {} } as any)).rejects.toThrow(
      'role and organization assignment',
    )
  })
})
