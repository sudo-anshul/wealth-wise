'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { WealthWiseLogo } from '@/components/brand';
import './public.css';

export function Brand() {
  return <WealthWiseLogo className="public-brand" />;
}

export function PublicShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="public-site">
    <a className="public-skip" href="#public-main">Skip to content</a>
    <header className="public-header public-container">
      <Brand />
      <nav className="public-nav" aria-label="Main navigation"><Link href="/product">The product</Link><Link href="/learn">Learn</Link><Link href="/calculators">Calculators</Link></nav>
      <div className="public-header-actions"><Link className="public-login" href="/login">Sign in</Link><Link className="public-button public-button-dark" href="/demo">Explore demo <ArrowUpRight size={18} aria-hidden="true" /></Link><button className="public-menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="public-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </header>
    {menuOpen && <nav className="public-mobile-menu public-container" id="public-mobile-menu" aria-label="Mobile navigation" onClick={() => setMenuOpen(false)}><Link href="/product">The product</Link><Link href="/learn">Learn</Link><Link href="/calculators">Calculators</Link><Link href="/login">Sign in</Link><Link href="/signup">Create an account</Link></nav>}
    <main id="public-main">{children}</main>
    <footer className="public-footer public-container"><div className="public-footer-top"><div><Brand /><p>A little clarity for your next money move.</p></div><nav aria-label="Footer navigation"><Link href="/product">Product</Link><Link href="/about">Our approach</Link><Link href="/help">Help</Link><Link href="/security">Security</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div><div className="public-footer-bottom"><span>© {new Date().getFullYear()} WealthWise</span><span>Built for understanding. Investing involves risk; projections are estimates.</span></div></footer>
  </div>;
}
