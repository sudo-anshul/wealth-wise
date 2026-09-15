import { WorkspaceProvider } from '@/components/workspace-provider';
import { AppShell } from '@/components/app-shell';
export const metadata={title:'Explore your workspace',robots:{index:false,follow:false}};
export default function DemoLayout({children}:{children:React.ReactNode}){return <WorkspaceProvider mode="demo"><AppShell>{children}</AppShell></WorkspaceProvider>;}
