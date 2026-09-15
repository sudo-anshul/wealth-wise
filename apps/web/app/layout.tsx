import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'WealthWise — A clearer view of your money',template:'%s · WealthWise'},description:'Understand your money, plan what matters, and build confidence. A thoughtfully designed personal finance workspace.',robots:{index:true,follow:true}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#183b32'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
