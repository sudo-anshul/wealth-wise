import {redirect} from 'next/navigation';
import {getWorkspace} from '@/server/workspace';
export default async function Workspace(){let hasAccounts=false;try{hasAccounts=(await getWorkspace()).accounts.length>0;}catch{redirect('/app/overview');}redirect(hasAccounts?'/app/overview':'/app/onboarding');}
