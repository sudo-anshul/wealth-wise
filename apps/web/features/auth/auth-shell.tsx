import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { WealthWiseLogo } from '@/components/brand';
import type { ReactNode } from 'react';
import './auth.css';

export function AuthShell({ children }: { children: ReactNode }) {
  return <main className="auth-page"><header className="auth-top"><WealthWiseLogo markSize={30} /><Link href="/demo" className="auth-demo">Explore the demo <ArrowUpRight size={18}/></Link></header><div className="auth-layout"><aside className="auth-story"><span className="eyebrow">Wealth, in focus.</span><h2>A clearer view<br/>starts <em>here.</em></h2><p>Bring your money, investments and goals into one thoughtful space.</p><div className="auth-illustration" aria-hidden="true"><div className="auth-ring ring-one"/><div className="auth-ring ring-two"/><div className="auth-orb"/><div className="auth-leaf"/><span className="auth-art-caption">CLARITY, ONE STEP AT A TIME.</span></div><div className="auth-story-note">Start with a complete sample workspace.<br/>Add your own information when you are ready.</div></aside>{children}</div><footer className="auth-bottom"><span>Make space for what matters.</span><nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/help">Help</Link></nav></footer></main>;
}
