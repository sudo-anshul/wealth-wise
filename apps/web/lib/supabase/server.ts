import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

export async function createSupabaseServerClient() {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy refreshes the session. */ }
      }
    }
  });
}

/** Clear this project's browser session even if remote refresh-token revocation is unavailable. */
export async function clearSupabaseSessionCookies() {
  const config = supabaseConfig();
  if (!config) return;
  const prefix = `sb-${new URL(config.url).hostname.split('.')[0]}-auth-token`;
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name === prefix || name.startsWith(`${prefix}.`) || name === `${prefix}-code-verifier`) {
      store.set(name, '', { path: '/', maxAge: 0, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    }
  }
}
