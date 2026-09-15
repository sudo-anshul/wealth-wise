import {WorkspaceProvider} from '@/components/workspace-provider';
import {CalculatorsView} from '@/features/planning/calculators';
export const metadata={title:'SIP, EMI and goal calculators'};
export default function Calculators(){return <WorkspaceProvider mode="demo"><CalculatorsView publicMode/></WorkspaceProvider>;}
