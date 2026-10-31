import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthScreen } from './auth'
import {
  login,
  signup,
  requestPasswordRecovery,
  updateUser,
} from '@netlify/identity'
vi.mock('@netlify/identity', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getUser: vi.fn(),
  requestPasswordRecovery: vi.fn(),
  updateUser: vi.fn(),
  acceptInvite: vi.fn(),
}))
afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())
const setup = (callback: any = null) => {
  const onDone = vi.fn().mockResolvedValue(undefined),
    onDemo = vi.fn().mockResolvedValue(undefined)
  render(<AuthScreen callback={callback} onDone={onDone} onDemo={onDemo} />)
  return { onDone, onDemo }
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}
describe('Account entry', () => {
  it('authenticates before opening the workspace', async () => {
    const { onDone } = setup()
    fill('Email address', 'sales@example.test')
    fill('Password', 'Solar-work123')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(login).toHaveBeenCalledWith('sales@example.test', 'Solar-work123')
  })
  it('keeps rejected credentials out of the workspace', async () => {
    vi.mocked(login).mockRejectedValueOnce(new Error('Invalid credentials'))
    const { onDone } = setup()
    fill('Email address', 'sales@example.test')
    fill('Password', 'incorrect')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials',
    )
    expect(onDone).not.toHaveBeenCalled()
  })
  it('requires matching registration passwords before contacting Identity', async () => {
    setup()
    fireEvent.click(screen.getByText('Create an account'))
    fill('Full name', 'Kavya Rao')
    fill('Company name', 'Solar Works')
    fill('Email address', 'kavya@example.test')
    fill('Phone number', '9876543210')
    fill('Password', 'Solar-work123')
    fill('Confirm password', 'different123')
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('do not match')
    expect(signup).not.toHaveBeenCalled()
  })
  it('registers contact metadata without client-selected permissions', async () => {
    vi.mocked(signup).mockResolvedValueOnce({ id: 'user' })
    const { onDone } = setup()
    fireEvent.click(screen.getByText('Create an account'))
    fill('Full name', 'Kavya Rao')
    fill('Company name', 'Solar Works')
    fill('Email address', 'kavya@example.test')
    fill('Phone number', '9876543210')
    fill('Password', 'Solar-work123')
    fill('Confirm password', 'Solar-work123')
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your email',
    )
    expect(signup).toHaveBeenCalledWith('kavya@example.test', 'Solar-work123', {
      full_name: 'Kavya Rao',
      company_name: 'Solar Works',
      phone: '9876543210',
    })
    expect(onDone).not.toHaveBeenCalled()
  })
  it('requests recovery and sets the password from a recovery callback', async () => {
    setup()
    fireEvent.click(screen.getByText('Forgot password?'))
    fill('Email address', 'kavya@example.test')
    fireEvent.click(screen.getByText('Send reset link'))
    await waitFor(() =>
      expect(requestPasswordRecovery).toHaveBeenCalledWith(
        'kavya@example.test',
      ),
    )
    cleanup()
    const { onDone } = setup({ type: 'recovery' })
    fill('New password', 'New-solar123')
    fill('Confirm password', 'New-solar123')
    fireEvent.click(screen.getByText('Save password'))
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(updateUser).toHaveBeenCalledWith({ password: 'New-solar123' })
  })
  it('enters the demo explicitly without creating an account', async () => {
    const { onDemo } = setup()
    fireEvent.click(screen.getByText('Try Demo'))
    await waitFor(() => expect(onDemo).toHaveBeenCalledOnce())
    expect(login).not.toHaveBeenCalled()
    expect(signup).not.toHaveBeenCalled()
  })
})
