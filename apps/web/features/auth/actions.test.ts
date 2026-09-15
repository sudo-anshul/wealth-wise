import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ client: vi.fn(), clear: vi.fn(), site: vi.fn(), redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: mocks.client, clearSupabaseSessionCookies: mocks.clear }));
vi.mock('@/lib/supabase/config', () => ({ configuredSiteUrl: mocks.site }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import { recoverAction, signInAction, signUpAction, updatePasswordAction } from './actions';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}
const signup = { name: 'Asha', email: 'asha@example.test', password: 'a memorable passphrase', terms: 'on' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.site.mockReturnValue('https://wealthwise.example');
  mocks.redirect.mockImplementation((destination: string) => { throw new Error(`REDIRECT:${destination}`); });
});

describe('authentication server actions', () => {
  it('validates signup consent and passwords before contacting the provider', async () => {
    const noConsent = await signUpAction({}, form({ ...signup, terms: '' }));
    expect(noConsent.fields?.terms).toBeTruthy();
    const weakPassword = await signUpAction({}, form({ ...signup, password: 'short' }));
    expect(weakPassword.fields?.password).toBeTruthy();
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('uses the configured callback and does not reveal existing addresses through signup acknowledgements', async () => {
    const signUp = vi.fn()
      .mockResolvedValueOnce({ data: { session: null }, error: null })
      .mockResolvedValueOnce({ data: { session: null }, error: { code: 'user_already_exists' } });
    mocks.client.mockResolvedValue({ auth: { signUp } });
    const fresh = await signUpAction({}, form(signup));
    const existing = await signUpAction({}, form(signup));
    expect(existing).toEqual(fresh);
    expect(fresh.success).toBeTruthy();
    expect(signUp).toHaveBeenCalledWith({
      email: signup.email, password: signup.password,
      options: { data: { display_name: signup.name }, emailRedirectTo: 'https://wealthwise.example/auth/callback' }
    });
  });

  it('keeps recovery responses neutral while requesting the approved password-update destination', async () => {
    const resetPasswordForEmail = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { code: 'email_not_found' } });
    mocks.client.mockResolvedValue({ auth: { resetPasswordForEmail } });
    const known = await recoverAction({}, form({ email: signup.email }));
    const unknown = await recoverAction({}, form({ email: 'unknown@example.test' }));
    expect(known).toEqual(unknown);
    expect(resetPasswordForEmail).toHaveBeenCalledWith(signup.email, { redirectTo: 'https://wealthwise.example/auth/callback?next=/update-password' });
  });

  it('rejects mismatched passwords before contacting the provider and requires a verified identity', async () => {
    const mismatched = await updatePasswordAction({}, form({ password: signup.password, confirmPassword: 'another passphrase' }));
    expect(mismatched.fields?.confirmPassword).toBeTruthy();
    expect(mocks.client).not.toHaveBeenCalled();
    const updateUser = vi.fn();
    mocks.client.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }), updateUser } });
    const missingSession = await updatePasswordAction({}, form({ password: signup.password, confirmPassword: signup.password }));
    expect(missingSession.error).toContain('recovery session');
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('clears the browser session after a password change even if remote sign-out is unavailable', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockRejectedValue(new Error('offline'));
    mocks.client.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'verified-user' } } }), updateUser, signOut } });
    await expect(updatePasswordAction({}, form({ password: signup.password, confirmPassword: signup.password }))).rejects.toThrow('REDIRECT:/login?updated=1');
    expect(updateUser).toHaveBeenCalledWith({ password: signup.password });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.clear).toHaveBeenCalledOnce();
  });

  it('does not expose provider details on rejected sign-in', async () => {
    mocks.client.mockResolvedValue({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: { message: 'private provider detail' } }) } });
    const result = await signInAction({}, form({ email: signup.email, password: signup.password }));
    expect(result.error).toContain('Email or password');
    expect(result.error).not.toContain('private provider detail');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
