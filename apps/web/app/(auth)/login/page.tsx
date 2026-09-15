import { AuthForm } from '@/features/auth/auth-form';
import { AuthShell } from '@/features/auth/auth-shell';
import { supabaseConfig } from '@/lib/supabase/config';
export const metadata = { title: 'Sign in' };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const params = await searchParams;
  return <AuthShell><AuthForm mode="login" enabled={!!supabaseConfig()} passwordUpdated={params.updated === '1'}/></AuthShell>;
}
