import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  const client = await createSupabaseServerClient();
  if (tokenHash && type && ['signup', 'email', 'recovery', 'email_change'].includes(type) && client) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
    if (!error) return NextResponse.redirect(new URL(type === 'recovery' ? '/update-password' : '/app', request.url));
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
