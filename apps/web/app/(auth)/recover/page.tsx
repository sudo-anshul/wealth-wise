import { AuthForm } from '@/features/auth/auth-form';
import { AuthShell } from '@/features/auth/auth-shell';
import { configuredSiteUrl, supabaseConfig } from '@/lib/supabase/config';
export const metadata = { title: 'Recover access — WealthWise' };
export default function RecoverPage() { return <AuthShell><AuthForm mode="recover" enabled={!!supabaseConfig() && !!configuredSiteUrl()}/></AuthShell>; }
