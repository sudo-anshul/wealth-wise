import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {WorkspaceProvider} from '@/components/workspace-provider';
import {AppShell} from '@/components/app-shell';
export const dynamic='force-dynamic';
export const metadata={title:'Your workspace',robots:{index:false,follow:false}};
export default async function AccountLayout({children}:{children:React.ReactNode}){const client=await createSupabaseServerClient();if(!client)redirect('/login');const {data}=await client.auth.getUser();if(!data.user)redirect('/login');return <WorkspaceProvider mode="account"><AppShell>{children}</AppShell></WorkspaceProvider>;}
