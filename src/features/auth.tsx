import { useState, type FormEvent } from 'react'
import { Sun, ArrowRight, Eye, EyeOff, ShieldCheck, Leaf } from 'lucide-react'
import {
  login,
  signup,
  logout,
  requestPasswordRecovery,
  getUser,
  updateUser,
  acceptInvite,
} from '@netlify/identity'

export type AuthCallback = { type: string; token?: string }
export function AuthScreen({
  onDone,
  onDemo,
  callback,
  error: workspaceError = '',
}: {
  onDone: () => Promise<void>
  onDemo: () => Promise<void>
  callback: AuthCallback | null
  error?: string
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const reset = !!callback
  function switchMode(next: typeof mode) {
    setMode(next)
    setError('')
    setNotice('')
    window.history.replaceState(null, '', '#' + next)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if ((mode === 'register' || reset) && password !== form.get('confirm'))
        throw new Error('The passwords do not match.')
      if (
        (mode === 'register' || reset) &&
        (password.length < 10 ||
          !/[a-zA-Z]/.test(password) ||
          !/[0-9]/.test(password))
      )
        throw new Error(
          'Use at least 10 characters, including a letter and a number.',
        )
      if (reset) {
        if (callback.type === 'invite')
          await acceptInvite(callback.token!, password)
        else await updateUser({ password })
        document.cookie = 'sunflow_session=active; Path=/; SameSite=Lax; Secure'
        await onDone()
      } else if (mode === 'forgot') {
        await requestPasswordRecovery(email)
        setNotice(
          'If an account exists for this address, a password reset link is on its way. Check your inbox and spam folder.',
        )
      } else if (mode === 'register') {
        const name = String(form.get('name') || '').trim()
        const company = String(form.get('company') || '').trim()
        const phone = String(form.get('phone') || '').trim()
        if (name.length < 2)
          throw new Error('Enter your full name (at least two characters).')
        if (company.length < 2)
          throw new Error('Enter your company name (at least two characters).')
        if (
          !/^[+()\d\s-]{7,24}$/.test(phone) ||
          phone.replace(/\D/g, '').length < 7
        )
          throw new Error(
            'Enter a valid phone number, including your area or country code.',
          )
        const user = await signup(email, password, {
          full_name: name,
          company_name: company,
          phone,
        })
        if (user.confirmedAt) {
          document.cookie =
            'sunflow_session=active; Path=/; SameSite=Lax; Secure'
          await onDone()
        } else
          setNotice(
            'Account created. Check your email to confirm your address, then sign in. An administrator must assign your company and role before you can access business records.',
          )
      } else {
        await login(email, password)
        // This preference contains no credentials. A session cookie scopes unchecked logins to this browser session.
        document.cookie =
          'sunflow_session=active; Path=/; SameSite=Lax; Secure' +
          (form.get('remember') ? '; Max-Age=2592000' : '')
        await onDone()
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Authentication is unavailable. Please try again or explore the demo.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function demo() {
    setBusy(true)
    setError('')
    try {
      if (await getUser()) await logout()
      await onDemo()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start the demo.')
    } finally {
      setBusy(false)
    }
  }
  const heading = reset
    ? 'Set your new password'
    : mode === 'register'
      ? 'Create your account'
      : mode === 'forgot'
        ? 'Reset your password'
        : 'Welcome back.'
  return (
    <main className="auth-page">
      <aside className="auth-story">
        <a className="auth-brand" href="#login">
          <span className="brand-icon">
            <Sun size={28} />
          </span>
          <span>
            SunFlow <strong>AI</strong>
            <small>SOLAR MANAGEMENT</small>
          </span>
        </a>
        <div className="auth-story-copy">
          <span className="eyebrow">FROM FIRST ENQUIRY TO EVERY ROOFTOP</span>
          <h1>
            Brighter days.
            <br />
            Connected teams.
          </h1>
          <p>
            Your customers, installations, inventory, and service — together in
            one workspace.
          </p>
          <div className="auth-roof" aria-hidden="true">
            <Sun size={64} />
            <div />
            <div />
            <div />
          </div>
        </div>
        <div className="auth-story-foot">
          <Leaf size={18} /> Built for the people powering solar.
        </div>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">SUNFLOW AI WORKSPACE</span>
          <h2>{heading}</h2>
          <p className="muted">
            {reset
              ? 'Choose a strong password to secure your account.'
              : mode === 'register'
                ? 'Bring your solar team together. All fields are required.'
                : mode === 'forgot'
                  ? 'Enter your email and we’ll send you a recovery link.'
                  : 'Sign in to keep your solar operations moving.'}
          </p>
          <form onSubmit={submit} key={mode + String(reset)}>
            {mode === 'register' && !reset && (
              <>
                <label className="field-label">
                  Full name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </label>
                <label className="field-label">
                  Company name
                  <input
                    name="company"
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={160}
                  />
                </label>
              </>
            )}
            {!reset && (
              <label className="field-label">
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@company.com"
                />
              </label>
            )}
            {mode === 'register' && !reset && (
              <label className="field-label">
                Phone number
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={24}
                />
              </label>
            )}
            {(mode !== 'forgot' || reset) && (
              <>
                <label className="field-label">
                  {reset ? 'New password' : 'Password'}
                  <span className="auth-password">
                    <input
                      name="password"
                      type={show ? 'text' : 'password'}
                      autoComplete={
                        reset || mode === 'register'
                          ? 'new-password'
                          : 'current-password'
                      }
                      required
                      minLength={reset || mode === 'register' ? 10 : 1}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      aria-label={show ? 'Hide password' : 'Show password'}
                      aria-pressed={show}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
                {(reset || mode === 'register') && (
                  <>
                    <small className="muted">
                      At least 10 characters, with a letter and a number.
                    </small>
                    <label className="field-label">
                      Confirm password
                      <input
                        name="confirm"
                        type={show ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={10}
                        maxLength={128}
                      />
                    </label>
                  </>
                )}
              </>
            )}
            {mode === 'login' && !reset && (
              <div className="auth-options">
                <label>
                  <input type="checkbox" name="remember" /> Remember me
                </label>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
            )}
            {(error || workspaceError) && (
              <div className="form-error" role="alert">
                {error || workspaceError}
              </div>
            )}
            {notice && (
              <p className="auth-notice" role="status">
                {notice}
              </p>
            )}
            <button
              className="button auth-submit"
              disabled={busy}
              type="submit"
            >
              {busy
                ? 'Please wait…'
                : reset
                  ? 'Save password'
                  : mode === 'register'
                    ? 'Register'
                    : mode === 'forgot'
                      ? 'Send reset link'
                      : 'Log in'}
              <ArrowRight size={17} />
            </button>
          </form>
          {!reset && (
            <p className="auth-switch">
              {mode === 'login'
                ? 'New to SunFlow AI? '
                : 'Already have an account? '}
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  switchMode(mode === 'login' ? 'register' : 'login')
                }
              >
                {mode === 'login' ? 'Create an account' : 'Return to login'}
              </button>
            </p>
          )}
          <div className="auth-demo">
            <span>Take a look around</span>
            <button className="button secondary" disabled={busy} onClick={demo}>
              Try Demo <ArrowRight size={16} />
            </button>
            <small>
              Explore all six roles with fictional records.
              <br />
              Demo data stays separate from your company.
            </small>
          </div>
          <p className="auth-security">
            <ShieldCheck size={15} /> Secure sign-in · Access controlled by your
            administrator
          </p>
        </div>
      </section>
    </main>
  )
}
