'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { recoverAction, signInAction, signUpAction, updatePasswordAction, type AuthState } from './actions';

export type AuthMode = 'login' | 'signup' | 'recover' | 'update';
const copy = {
  login: { title: 'Your money. In focus.', description: 'Welcome back. Pick up where you left off.', submit: 'Sign in', pending: 'Signing in…' },
  signup: { title: 'Make room for more.', description: 'More clarity. More intention. More possibility.', submit: 'Create account', pending: 'Creating your account…' },
  recover: { title: 'A simple way back.', description: 'Enter the email you use for WealthWise. We will help you recover access.', submit: 'Send recovery link', pending: 'Sending instructions…' },
  update: { title: 'A fresh start.', description: 'Choose a unique password to protect your workspace.', submit: 'Update password', pending: 'Updating your password…' }
};

export function AuthForm({ mode, enabled, passwordUpdated = false }: { mode: AuthMode; enabled: boolean; passwordUpdated?: boolean }) {
  const actions = { login: signInAction, signup: signUpAction, recover: recoverAction, update: updatePasswordAction };
  const [state, action, pending] = useActionState<AuthState, FormData>(actions[mode], {});
  const text = copy[mode];
  const fieldError = (field: string) => state.fields?.[field] ? <span className="auth-field-error" id={`${field}-error`}>{state.fields[field]}</span> : null;
  return <section className="auth-card" aria-labelledby="auth-title">
    <div className="auth-icon"><LockKeyhole size={23}/></div>
    <h1 id="auth-title">{text.title}</h1><p className="auth-description">{text.description}</p>
    {!enabled && <div className="notice auth-notice" role="status">Account access is awaiting setup. Explore the complete demo while private storage is being configured.</div>}
    {passwordUpdated && <div className="notice auth-notice" role="status">Your password has been updated. Sign in with your new password.</div>}
    {state.success ? <div className="auth-success" role="status"><strong>Check your next step.</strong><p>{state.success}</p><Link href="/login" className="text-link">Back to sign in <ArrowUpRight size={17}/></Link></div> : <form action={action} className="form-stack" aria-busy={pending}>
      {mode === 'signup' && <label className="field" htmlFor="name">Your name<input className="input" id="name" name="name" autoComplete="name" maxLength={80} required disabled={!enabled || pending} aria-invalid={!!state.fields?.name} aria-describedby={state.fields?.name ? 'name-error' : undefined}/>{fieldError('name')}</label>}
      {mode !== 'update' && <label className="field" htmlFor="email">Email address<input className="input" id="email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!enabled || pending} placeholder="you@example.com" aria-invalid={!!state.fields?.email} aria-describedby={state.fields?.email ? 'email-error' : undefined}/>{fieldError('email')}</label>}
      {mode !== 'recover' && <label className="field" htmlFor="password"><span className="auth-field-heading">{mode === 'update' ? 'New password' : 'Password'}{mode === 'login' && <Link href="/recover">Forgot password?</Link>}</span><input className="input" id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} required disabled={!enabled || pending} aria-invalid={!!state.fields?.password} aria-describedby={state.fields?.password ? 'password-error' : mode !== 'login' ? 'password-guidance' : undefined}/>{mode !== 'login' && <small id="password-guidance">Use a unique password with at least 12 characters. A memorable passphrase works well.</small>}{fieldError('password')}</label>}
      {mode === 'update' && <label className="field" htmlFor="confirmPassword">Confirm new password<input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={!enabled || pending} aria-invalid={!!state.fields?.confirmPassword} aria-describedby={state.fields?.confirmPassword ? 'confirmPassword-error' : undefined}/>{fieldError('confirmPassword')}</label>}
      {mode === 'signup' && <div><label className="auth-terms"><input type="checkbox" name="terms" required disabled={!enabled || pending}/><span>I agree to the <Link href="/terms">Terms of Service</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</span></label>{fieldError('terms')}</div>}
      {state.error && <div className="form-error" role="alert">{state.error}</div>}
      <button className={`button ${mode === 'signup' ? 'button-lime' : 'button-primary'} auth-submit`} type="submit" disabled={!enabled || pending}>{pending ? text.pending : text.submit}{!pending && <ArrowUpRight size={18}/>}</button>
    </form>}
    <div className="auth-switch">{mode === 'login' ? <>New to WealthWise? <Link href="/signup">Create an account</Link></> : mode === 'signup' ? <>Already have an account? <Link href="/login">Sign in</Link></> : <Link href={mode === 'update' ? '/recover' : '/login'}>{mode === 'update' ? 'Request a fresh recovery link' : 'Back to sign in'}</Link>}</div>
    <div className="auth-card-footer"><LockKeyhole size={14}/><span>One account for your money, investments and goals.</span></div>
  </section>;
}
