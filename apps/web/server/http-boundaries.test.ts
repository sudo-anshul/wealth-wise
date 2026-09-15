import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { emptyWorkspace } from '@wealthwise/contracts';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), get: vi.fn(), client: vi.fn(), clear: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/workspace', () => ({ executeCommand: mocks.execute, getWorkspace: mocks.get }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: mocks.client, clearSupabaseSessionCookies: mocks.clear }));

import { POST as commandPost } from '@/app/api/commands/route';
import { GET as workspaceGet } from '@/app/api/workspace/route';
import { GET as callbackGet } from '@/app/auth/callback/route';
import { GET as confirmGet } from '@/app/auth/confirm/route';
import { POST as signoutPost } from '@/app/auth/signout/route';
import { ServiceError } from './errors';

const origin = 'https://wealthwise.example';
const payload = { command: { type: 'save-preferences', preferences: emptyWorkspace().preferences }, expectedVersion: 0 };
function request(body = JSON.stringify(payload), headers: Record<string, string> = {}) {
  return new NextRequest(`${origin}/api/commands`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body });
}

beforeEach(() => { vi.resetAllMocks(); });

describe('HTTP command boundary', () => {
  it('accepts a validated same-origin command and marks its result private', async () => {
    const state = emptyWorkspace(); state.version = 1; mocks.execute.mockResolvedValue(state);
    const response = await commandPost(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ workspace: state });
    expect(mocks.execute).toHaveBeenCalledWith(payload.command, 0);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it.each([undefined, 'https://outside.example', 'null'])('rejects a missing or cross-site origin (%s)', async value => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (value) headers.origin = value;
    const response = await commandPost(new NextRequest(`${origin}/api/commands`, { method: 'POST', headers, body: JSON.stringify(payload) }));
    expect(response.status).toBe(403);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('rejects wrong content type, malformed JSON and an invalid command', async () => {
    expect((await commandPost(request('x', { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await commandPost(request('{broken'))).status).toBe(400);
    expect((await commandPost(request('{}'))).status).toBe(422);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('enforces its body ceiling with and without a content-length header', async () => {
    expect((await commandPost(request('{}', { 'content-length': '256001' }))).status).toBe(413);
    expect((await commandPost(request(' '.repeat(256001)))).status).toBe(413);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it.each([401, 409, 503])('preserves actionable service status %s', async status => {
    mocks.execute.mockRejectedValue(new ServiceError(status, 'TEST_CODE', 'Useful message.'));
    const response = await commandPost(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: { code: 'TEST_CODE', message: 'Useful message.' } });
  });

  it('never exposes unexpected internal error details', async () => {
    mocks.execute.mockRejectedValue(new Error('PRIVATE_DATABASE_DETAIL'));
    const response = await commandPost(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('PRIVATE_DATABASE_DETAIL');
  });

  it('returns a private unauthenticated workspace error instead of sample data', async () => {
    mocks.get.mockRejectedValue(new ServiceError(401, 'UNAUTHENTICATED', 'Sign in.'));
    const response = await workspaceGet();
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ error: { code: 'UNAUTHENTICATED', message: 'Sign in.' } });
  });
});

describe('auth callback destinations', () => {
  it.each(['https://outside.example', '//outside.example', '/app/../../outside', '/login'])('ignores an unapproved return URL %s', async next => {
    const exchange = vi.fn().mockResolvedValue({ error: null });
    mocks.client.mockResolvedValue({ auth: { exchangeCodeForSession: exchange } });
    const response = await callbackGet(new NextRequest(`${origin}/auth/callback?code=sample-code&next=${encodeURIComponent(next)}`));
    expect(response.headers.get('location')).toBe(`${origin}/app`);
    expect(exchange).toHaveBeenCalledWith('sample-code');
  });

  it('returns a successful recovery exchange to the password form', async () => {
    mocks.client.mockResolvedValue({ auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) } });
    const response = await callbackGet(new NextRequest(`${origin}/auth/callback?code=sample-code&next=/update-password`));
    expect(response.headers.get('location')).toBe(`${origin}/update-password`);
  });

  it('does not echo failed auth codes or tokens into its error destination', async () => {
    mocks.client.mockResolvedValue({ auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: 'expired' } }) } });
    const response = await callbackGet(new NextRequest(`${origin}/auth/callback?code=private-code`));
    expect(response.headers.get('location')).toBe(`${origin}/auth/error`);
  });

  it('supports recovery token hashes and ignores a caller-supplied destination', async () => {
    const verify = vi.fn().mockResolvedValue({ error: null });
    mocks.client.mockResolvedValue({ auth: { verifyOtp: verify } });
    const response = await confirmGet(new NextRequest(`${origin}/auth/confirm?token_hash=sample-hash&type=recovery&next=https://outside.example`));
    expect(verify).toHaveBeenCalledWith({ token_hash: 'sample-hash', type: 'recovery' });
    expect(response.headers.get('location')).toBe(`${origin}/update-password`);
  });

  it('rejects unsupported verification types without contacting the auth provider', async () => {
    const verify = vi.fn(); mocks.client.mockResolvedValue({ auth: { verifyOtp: verify } });
    const response = await confirmGet(new NextRequest(`${origin}/auth/confirm?token_hash=sample-hash&type=admin`));
    expect(response.headers.get('location')).toBe(`${origin}/auth/error`);
    expect(verify).not.toHaveBeenCalled();
  });

  it('requires same-origin POST before signing out', async () => {
    const response = await signoutPost(new NextRequest(`${origin}/auth/signout`, { method: 'POST', headers: { origin: 'https://outside.example' } }));
    expect(response.status).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('clears the local browser session when remote sign-out is temporarily unavailable', async () => {
    mocks.client.mockResolvedValue({ auth: { signOut: vi.fn().mockRejectedValue(new Error('offline')) } });
    const response = await signoutPost(new NextRequest(`${origin}/auth/signout`, { method: 'POST', headers: { origin } }));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`${origin}/login`);
    expect(mocks.clear).toHaveBeenCalledOnce();
  });
});
