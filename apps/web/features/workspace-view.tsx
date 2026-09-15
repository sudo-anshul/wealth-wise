'use client';
import {FinanceView} from '@/features/finance';
import {LearningView} from '@/features/education/learning';
import {CalculatorsView} from '@/features/planning/calculators';
import {SettingsView} from '@/features/settings/settings';
import {PracticeView} from '@/features/practice/practice';
import {InsightsView} from '@/features/insights/insights';
import {OnboardingView} from '@/features/onboarding/onboarding';
export const workspaceViews=['overview','accounts','transactions','budgets','portfolio','markets','goals','debt','learn','tools','settings','simulator','insights','onboarding'];
export function WorkspaceView({view}:{view:string}){
  if(view==='learn')return <LearningView/>;
  if(view==='tools')return <CalculatorsView/>;
  if(view==='settings')return <SettingsView/>;
  if(view==='simulator')return <PracticeView/>;
  if(view==='insights')return <InsightsView/>;
  if(view==='onboarding')return <OnboardingView/>;
  return <FinanceView view={view}/>;
}
