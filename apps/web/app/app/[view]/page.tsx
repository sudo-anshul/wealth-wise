import {notFound} from 'next/navigation';
import {WorkspaceView} from '@/features/workspace-view';
const views=['overview','accounts','transactions','budgets','portfolio','markets','goals','debt','learn','tools','settings','simulator','insights','onboarding'];
export default async function WorkspacePage({params}:{params:Promise<{view:string}>}){const {view}=await params;if(!views.includes(view))notFound();return <WorkspaceView view={view}/>;}
