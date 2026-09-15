import {notFound} from 'next/navigation';
import {PublicLesson} from '@/features/education/learning';
import {lessons} from '@/features/education/content';
export function generateStaticParams(){return lessons.map(l=>({slug:l.id}));}
export default async function LessonPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!lessons.some(l=>l.id===slug))notFound();return <PublicLesson slug={slug}/>;}
