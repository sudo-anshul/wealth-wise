import 'server-only';
import { NextResponse } from 'next/server';

export class ServiceError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function errorResponse(error: unknown) {
  const known = error instanceof ServiceError;
  return NextResponse.json({ error: { code: known ? error.code : 'INTERNAL_ERROR', message: known ? error.message : 'Something went wrong. Please try again.' } }, {
    status: known ? error.status : 500,
    headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
  });
}
