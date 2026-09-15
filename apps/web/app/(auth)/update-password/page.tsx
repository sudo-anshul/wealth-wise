import { AuthForm } from '@/features/auth/auth-form';
import { AuthShell } from '@/features/auth/auth-shell';
import { supabaseConfig } from '@/lib/supabase/config';
export const metadata = { title: 'Update password' };
export default function UpdatePasswordPage() { return <AuthShell><AuthForm mode="update" enabled={!!supabaseConfig()}/></AuthShell>; }
