import { NextResponse } from 'next/server';
import { getWorkspace } from '@/server/workspace';
import { errorResponse } from '@/server/errors';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { return NextResponse.json({ workspace: await getWorkspace() }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } }); }
  catch (error) { return errorResponse(error); }
}
