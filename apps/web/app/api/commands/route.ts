import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { commandSchema } from '@wealthwise/contracts';
import { executeCommand } from '@/server/workspace';
import { errorResponse, ServiceError } from '@/server/errors';

export const dynamic = 'force-dynamic';
const bodySchema = z.object({ command: commandSchema, expectedVersion: z.number().int().nonnegative().safe() }).strict();
const MAX_BODY_BYTES = 256_000;

async function readBoundedBody(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceError(400, 'INVALID_JSON', 'The change could not be read.');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ServiceError(413, 'TOO_LARGE', 'This change is too large. Import fewer rows at a time.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new ServiceError(400, 'INVALID_JSON', 'The change could not be read.'); }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin !== request.nextUrl.origin) throw new ServiceError(403, 'INVALID_ORIGIN', 'Open WealthWise directly to save changes.');
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ServiceError(415, 'INVALID_CONTENT_TYPE', 'Send changes as JSON.');
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) throw new ServiceError(413, 'TOO_LARGE', 'This change is too large. Import fewer rows at a time.');
    const raw = await readBoundedBody(request);
    let json: unknown;
    try { json = JSON.parse(raw); } catch { throw new ServiceError(400, 'INVALID_JSON', 'The change could not be read.'); }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new ServiceError(422, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Check the values in this change.');
    const workspace = await executeCommand(parsed.data.command, parsed.data.expectedVersion);
    return NextResponse.json({ workspace }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } });
  } catch (error) { return errorResponse(error); }
}
