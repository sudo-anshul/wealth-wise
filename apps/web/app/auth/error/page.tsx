import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { AuthShell } from '@/features/auth/auth-shell';
export const metadata = { title: 'Link unavailable — WealthWise' };
export default function AuthErrorPage() {
  return <AuthShell><section className="auth-card"><div className="auth-icon"><KeyRound size={24}/></div><h1>Let’s try a fresh link.</h1><p className="auth-description">This link may have expired, already been used, or opened in a different browser. Request a new recovery link or return to sign in.</p><div className="auth-error-actions"><Link className="button button-primary" href="/recover">Recover access</Link><Link className="button button-secondary" href="/login">Back to sign in</Link></div></section></AuthShell>;
}
