import { AuthForm } from '@/features/auth/auth-form';
import { AuthShell } from '@/features/auth/auth-shell';
import { configuredSiteUrl, supabaseConfig } from '@/lib/supabase/config';
export const metadata = { title: 'Create account' };
export default function SignupPage() { return <AuthShell><AuthForm mode="signup" enabled={!!supabaseConfig() && !!configuredSiteUrl()}/></AuthShell>; }
