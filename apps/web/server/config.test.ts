import { afterEach, describe, expect, it, vi } from 'vitest';
import { configuredSiteUrl, supabaseConfig } from '../lib/supabase/config';

afterEach(() => { vi.unstubAllEnvs(); });
describe('Supabase environment configuration', () => {
  it('accepts the legacy anon key when the example publishable variable is blank', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sample-public-key');
    expect(supabaseConfig()).toEqual({ url: 'https://project.supabase.co', key: 'sample-public-key' });
  });
  it('returns unconfigured rather than initializing a client without credentials', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(supabaseConfig()).toBeNull();
  });
  it('supports local HTTP while rejecting remote clear-text auth endpoints', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sample-public-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    expect(supabaseConfig()).not.toBeNull();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://remote.example');
    expect(supabaseConfig()).toBeNull();
  });
  it('normalizes a configured redirect to its origin and rejects unsafe schemes', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wealthwise.example/a-path');
    expect(configuredSiteUrl()).toBe('https://wealthwise.example');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'javascript:alert(1)');
    expect(configuredSiteUrl()).toBeNull();
  });
});
