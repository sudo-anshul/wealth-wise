'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { configuredSiteUrl } from '@/lib/supabase/config';

export type AuthState = { error?: string; success?: string; fields?: Record<string, string> };
const emailSchema = z.email().max(254);
const passwordSchema = z.string().min(12, 'Use at least 12 characters.').max(128, 'Use no more than 128 characters.');

function invalid(error: z.ZodError): AuthState {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[String(issue.path[0])] ??= issue.message;
  return { error: 'Please check the highlighted fields.', fields };
}
function unavailable(): AuthState { return { error: 'Account access is not configured yet. Please explore the demo for now.' }; }

export async function signInAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password.').max(128) }).safeParse({ email: String(form.get('email') ?? '').trim(), password: form.get('password') });
  if (!parsed.success) return invalid(parsed.error);
  const client = await createSupabaseServerClient();
  if (!client) return unavailable();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Email or password was not accepted. Check your details or recover access.' };
  redirect('/app');
}

export async function signUpAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ name: z.string().trim().min(1, 'Enter your name.').max(80), email: emailSchema, password: passwordSchema, terms: z.literal('on', 'Please agree to the Terms and Privacy Policy.') }).safeParse({ name: form.get('name'), email: String(form.get('email') ?? '').trim(), password: form.get('password'), terms: form.get('terms') });
  if (!parsed.success) return invalid(parsed.error);
  const client = await createSupabaseServerClient(); const site = configuredSiteUrl();
  if (!client || !site) return unavailable();
  const { data, error } = await client.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { display_name: parsed.data.name }, emailRedirectTo: `${site}/auth/callback` } });
  // Do not disclose whether an email address already belongs to another account.
  if (error) return { success: 'If this address can be registered, check your inbox for the next step. You can also sign in or try again later.' };
  if (data.session) redirect('/app');
  return { success: 'If verification is needed, we will email the next step. Check your inbox and spam folder, then follow the link to continue.' };
}

export async function recoverAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email: emailSchema }).safeParse({ email: String(form.get('email') ?? '').trim() });
  if (!parsed.success) return invalid(parsed.error);
  const client = await createSupabaseServerClient(); const site = configuredSiteUrl();
  if (!client || !site) return unavailable();
  await client.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${site}/auth/callback?next=/update-password` });
  return { success: 'If an account is eligible for recovery, instructions will be sent to that address. Check your inbox and spam folder.' };
}

export async function updatePasswordAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'The passwords must match.' }).safeParse({ password: form.get('password'), confirmPassword: form.get('confirmPassword') });
  if (!parsed.success) return invalid(parsed.error);
  const client = await createSupabaseServerClient();
  if (!client) return unavailable();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: 'This recovery session is no longer available. Request a new recovery link.' };
  const { error } = await client.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'The password could not be updated. Request a fresh recovery link and try a different password.' };
  await client.auth.signOut({ scope: 'local' });
  redirect('/login?updated=1');
}

export async function signOutAction() {
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut({ scope: 'local' });
  redirect('/login');
}
