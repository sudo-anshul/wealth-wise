import 'server-only';
import { commandSchema, workspaceSchema, type Command, type Workspace } from '@wealthwise/contracts';
import { applyCommand } from '@wealthwise/domain';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ServiceError } from './errors';

async function authenticatedClient() {
  const client = await createSupabaseServerClient();
  if (!client) throw new ServiceError(503, 'NOT_CONFIGURED', 'Account storage is not configured yet. You can still explore the demo.');
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new ServiceError(401, 'UNAUTHENTICATED', 'Sign in to use your private workspace.');
  return client;
}

function databaseError(error: { code?: string; message?: string }) {
  if (error.code === '40001') return new ServiceError(409, 'CONFLICT', 'Your workspace changed in another tab. Refresh and try again.');
  if (error.code === '42501') return new ServiceError(403, 'FORBIDDEN', 'This operation is not available for your account.');
  if (['23503', '23505', '23514', '22023', '22P02'].includes(error.code ?? '')) return new ServiceError(422, 'VALIDATION_ERROR', 'The change could not be saved because its records are inconsistent. Refresh and check your inputs.');
  if (['PGRST202', '42P01', '42883'].includes(error.code ?? '')) return new ServiceError(503, 'DATABASE_NOT_READY', 'Account storage is awaiting its database setup. Please try the demo for now.');
  return new ServiceError(503, 'STORAGE_UNAVAILABLE', 'Account storage is temporarily unavailable. Your change was not confirmed.');
}

async function readWithClient(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const { data, error } = await client.rpc('wealthwise_get_workspace');
  if (error) throw databaseError(error);
  const parsed = workspaceSchema.safeParse(data);
  if (!parsed.success) throw new ServiceError(503, 'INVALID_STORED_DATA', 'Your saved workspace could not be read safely. Please contact support.');
  return parsed.data;
}

export async function getWorkspace(): Promise<Workspace> { return readWithClient(await authenticatedClient()); }

export async function executeCommand(command: Command, expectedVersion: number): Promise<Workspace> {
  const client = await authenticatedClient();
  const previous = await readWithClient(client);
  if (previous.version !== expectedVersion) throw new ServiceError(409, 'CONFLICT', 'Your workspace changed in another tab. Refresh and try again.');
  let next: Workspace;
  try { next = applyCommand(previous, commandSchema.parse(command)); }
  catch (error) { throw new ServiceError(422, 'VALIDATION_ERROR', error instanceof Error ? error.message : 'Check the values in this change.'); }
  const { data, error } = await client.rpc('wealthwise_save_workspace', { p_expected_version: expectedVersion, p_workspace: next });
  if (error) throw databaseError(error);
  const parsed = workspaceSchema.safeParse(data);
  if (!parsed.success) throw new ServiceError(503, 'INVALID_STORED_DATA', 'The save response could not be verified. Refresh before retrying.');
  return parsed.data;
}
