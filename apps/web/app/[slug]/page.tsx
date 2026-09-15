import {notFound} from 'next/navigation';
import {PublicPage} from '@/features/public/pages';
const pages=['product','about','security','privacy','terms','help'];
export function generateStaticParams(){return pages.map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:slug.charAt(0).toUpperCase()+slug.slice(1)};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!pages.includes(slug))notFound();return <PublicPage slug={slug}/>;}
