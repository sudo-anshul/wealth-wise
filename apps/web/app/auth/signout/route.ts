import { NextRequest, NextResponse } from 'next/server';
import { clearSupabaseSessionCookies, createSupabaseServerClient } from '@/lib/supabase/server';
import { errorResponse, ServiceError } from '@/server/errors';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return errorResponse(new ServiceError(403, 'INVALID_ORIGIN', 'Open WealthWise directly to sign out.'));
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
  await clearSupabaseSessionCookies();
  return NextResponse.redirect(new URL('/login', request.url), 303);
}
