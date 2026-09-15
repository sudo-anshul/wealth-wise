'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, CircleCheck, Clock3, Compass, Search, Sparkles } from 'lucide-react';
import { Badge, Button, Card, Dialog, EmptyState, Input, PageHeader } from '@/components/ui';
import { useWorkspace } from '@/components/workspace-provider';
import { PublicShell } from '@/features/public/chrome';
import { glossary, learningPaths, lessons, type Lesson } from './content';
import './education.css';

function LessonArt({ color, small = false }: { color: Lesson['color']; small?: boolean }) {
  return <div className={`education-art education-art-${color} ${small ? 'education-art-small' : ''}`} aria-hidden="true"><div className="education-art-ring" /><div className="education-art-ring education-art-ring-inner" /><svg viewBox="0 0 240 200" fill="none"><path d="M45 160h35v-45H45zM103 160h35V80h-35zM161 160h35V40h-35z" fill="currentColor" opacity=".85" /><path d="M40 86 82 63l37 8 73-48m-19 0h19v19" stroke="var(--edu-coral)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="55" cy="38" r="10" fill="var(--edu-lime)" /><path d="M198 177v-15m-7 8h14" stroke="currentColor" strokeWidth="2" /></svg></div>;
}

export function LessonArticle({ lesson, completed = false, onComplete, pending = false, nextHref }: { lesson: Lesson; completed?: boolean; onComplete?: () => Promise<void>; pending?: boolean; nextHref?: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [saveError, setSaveError] = useState('');
  const correct = checked && selected === lesson.quiz.correctIndex;
  async function complete() { if (!onComplete) return; setSaveError(''); try { await onComplete(); } catch (error) { setSaveError(error instanceof Error ? error.message : 'Your progress could not be saved. Try again.'); } }
  return <article className="education-lesson"><div className="education-lesson-meta"><Badge>{lesson.category}</Badge><span><Clock3 size={16} aria-hidden="true" /> {lesson.minutes} min read</span>{completed && <Badge tone="green"><Check size={14} /> Completed</Badge>}</div><p className="education-lesson-intro">{lesson.subtitle}</p>
    {lesson.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.example && <aside className="education-example"><span className="education-label">{section.example.label}</span><p>{section.example.text}</p></aside>}</section>)}
    <aside className="education-takeaway"><Sparkles size={24} aria-hidden="true" /><div><strong>The idea to keep.</strong><p>{lesson.takeaway}</p></div></aside>
    <form className="education-quiz" onSubmit={event => { event.preventDefault(); if (selected !== null) setChecked(true); }}><fieldset><legend>A quick moment to reflect.</legend><p>{lesson.quiz.question}</p>{lesson.quiz.options.map((option, index) => <label key={option} className={`education-quiz-option ${selected === index ? 'is-selected' : ''}`}><input type="radio" name={`quiz-${lesson.id}`} value={index} checked={selected === index} onChange={() => { setSelected(index); setChecked(false); }} /><span>{option}</span></label>)}</fieldset><Button type="submit" variant="secondary" disabled={selected === null}>Check my answer</Button>{checked && <div className={`education-quiz-feedback ${correct ? 'is-correct' : ''}`} role="status"><strong>{correct ? 'That’s the idea.' : 'A useful second look.'}</strong><p>{lesson.quiz.explanation}</p></div>}</form>
    {saveError && <p className="education-error" role="alert">{saveError}</p>}
    <div className="education-lesson-actions">{onComplete ? <Button onClick={() => void complete()} disabled={pending || completed || !correct}>{completed ? <><CircleCheck size={18} /> Lesson completed</> : pending ? 'Saving your progress…' : <>Mark lesson complete <Check size={18} /></>}</Button> : <Link className="education-primary-link" href="/signup">Save your learning progress <ArrowUpRight size={18} /></Link>}{nextHref && <Link className="education-next-link" href={nextHref}>{lesson.next.label} <ArrowRight size={18} /></Link>}</div>
    <p className="education-footnote">Educational information, not personal financial advice. Examples simplify real-world conditions. No investment outcome is guaranteed.</p>
  </article>;
}

function LessonCard({ lesson, completed, onOpen, publicMode }: { lesson: Lesson; completed?: boolean; onOpen?: () => void; publicMode?: boolean }) {
  return <Card className="education-course"><LessonArt color={lesson.color} small /><div className="education-course-body"><div className="education-course-meta"><span>{lesson.category}</span>{completed && <CircleCheck size={19} aria-label="Completed" />}</div><h2>{lesson.title}</h2><p>{lesson.subtitle}</p><div className="education-course-bottom"><span><Clock3 size={15} aria-hidden="true" /> {lesson.minutes} min</span>{publicMode ? <Link href={`/learn/${lesson.id}`} className="education-next-link">Read lesson <ArrowUpRight size={17} /></Link> : <Button variant="ghost" onClick={onOpen}>{completed ? 'Read again' : 'Open lesson'} <ArrowUpRight size={17} /></Button>}</div></div></Card>;
}

export function LearningView() {
  const { state, basePath, pending, dispatch } = useWorkspace();
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const lesson = lessons.find(item => item.id === selectedLesson);
  const completed = lessons.filter(item => state.completedLessons.includes(item.id)).length;
  const filtered = lessons.filter(item => (category === 'All' || item.category === category) && `${item.title} ${item.subtitle} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  const categories = ['All', ...new Set(lessons.map(item => item.category))];
  return <div className="education-view"><PageHeader eyebrow="The WealthWise notebook" title="A little wiser. A little more confident." description="Useful ideas for your money, with room to learn at your own pace." />
    <section className="education-hero"><div className="education-hero-copy"><span className="education-label">SMALL IDEAS. LASTING PERSPECTIVE.</span><h2>Your next chapter<br />starts with a little curiosity.</h2><p>Understand the why behind a decision. A few minutes can give you a fresh way to see the picture.</p><div className="education-hero-actions"><Button variant="lime" onClick={() => setSelectedLesson(lessons.find(item => !state.completedLessons.includes(item.id))?.id ?? 'compounding')}>{completed ? 'Continue learning' : 'Start with one idea'} <ArrowUpRight size={18} /></Button><span>{completed} of {lessons.length} lessons completed</span></div></div><LessonArt color="forest" /></section>
    <div className="education-section-heading"><div><h2>Choose a starting point.</h2><p>Three paths, connected by the same useful ideas.</p></div><Badge tone="green">Your progress is saved</Badge></div>
    <div className="education-path-grid">{learningPaths.map((path, index) => { const finished = path.lessonIds.filter(id => state.completedLessons.includes(id)).length; return <Card key={path.name} className="education-path"><div className="education-path-top"><span>0{index + 1}</span><Compass size={22} aria-hidden="true" /></div><h3>{path.name}</h3><p>{path.description}</p><div className="education-progress" role="progressbar" aria-label={`${path.name} progress`} aria-valuenow={finished} aria-valuemin={0} aria-valuemax={path.lessonIds.length}><i style={{ width: `${finished / path.lessonIds.length * 100}%` }} /></div><div className="education-path-footer"><span>{finished}/{path.lessonIds.length} complete</span><Button variant="ghost" onClick={() => setSelectedLesson(path.lessonIds.find(id => !state.completedLessons.includes(id)) ?? path.lessonIds[0]!)}>{finished === path.lessonIds.length ? 'Revisit' : 'Explore'} <ArrowRight size={17} /></Button></div></Card>; })}</div>
    <div className="education-section-heading"><div><h2>The whole notebook.</h2><p>Find an idea for the question on your mind.</p></div><div className="education-search"><Search size={18} aria-hidden="true" /><Input aria-label="Search lessons" placeholder="Search the notebook" value={query} onChange={event => setQuery(event.target.value)} /></div></div>
    <div className="education-filters" role="group" aria-label="Lesson category">{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    {filtered.length ? <div className="education-course-grid">{filtered.map(item => <LessonCard key={item.id} lesson={item} completed={state.completedLessons.includes(item.id)} onOpen={() => setSelectedLesson(item.id)} />)}</div> : <Card><EmptyState title="A different search might help." description="Try a topic such as borrowing, fees or everyday money." action={<Button variant="secondary" onClick={() => { setQuery(''); setCategory('All'); }}>Show all lessons</Button>} /></Card>}
    <Glossary />
    <Dialog open={Boolean(lesson)} onOpenChange={open => { if (!open) setSelectedLesson(null); }} title={lesson?.title ?? 'The WealthWise notebook'} description="Read the idea, try the example, then check your understanding.">{lesson && <LessonArticle key={lesson.id} lesson={lesson} completed={state.completedLessons.includes(lesson.id)} pending={pending} onComplete={() => dispatch({ type: 'complete-lesson', lessonId: lesson.id })} nextHref={`${basePath}/${lesson.next.path}`} />}</Dialog>
  </div>;
}

function Glossary() {
  return <section className="education-glossary"><div className="education-section-heading"><div><h2>A few words, made clearer.</h2><p>A short glossary to keep nearby.</p></div><BookOpen size={27} aria-hidden="true" /></div><div className="education-glossary-grid">{glossary.map(item => <details key={item.term}><summary>{item.term}<span aria-hidden="true">＋</span></summary><p>{item.definition}</p></details>)}</div></section>;
}

export function PublicLearningLibrary() {
  return <PublicShell><div className="public-container education-public"><header className="public-page-hero"><div className="public-eyebrow">THE WEALTHWISE NOTEBOOK</div><h1>A little learning.<br />A richer perspective.</h1><p>Small ideas, carefully explained. Explore six practical lessons on everyday money, investing and planning ahead.</p></header><div className="education-course-grid">{lessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} publicMode />)}</div><Glossary /><div className="public-content-cta"><p><strong>Keep your place in the notebook.</strong>A workspace saves your completed lessons alongside your goals.</p><Link href="/signup" className="public-button public-button-dark">Create your workspace <ArrowUpRight size={18} /></Link></div></div></PublicShell>;
}

export function PublicLesson({ slug }: { slug: string }) {
  const lesson = lessons.find(item => item.id === slug);
  if (!lesson) return <PublicShell><div className="public-container education-public"><EmptyState title="This lesson isn’t in the notebook." description="Explore a different idea in the learning library." action={<Link href="/learn" className="education-primary-link">Browse all lessons</Link>} /></div></PublicShell>;
  const publicNext = lesson.next.path.startsWith('tools') ? `/calculators?${lesson.next.path.split('?')[1] ?? 'kind=sip'}` : `/demo/${lesson.next.path}`;
  return <PublicShell><div className="public-container education-public-reader"><Link href="/learn" className="education-next-link">← Back to the notebook</Link><header className="public-page-hero"><div className="public-eyebrow">{lesson.category}</div><h1>{lesson.title}</h1></header><LessonArticle key={lesson.id} lesson={lesson} nextHref={publicNext} /><section className="education-reader-more"><h2>Keep a little curiosity going.</h2><Link href="/learn" className="education-next-link">Explore the other lessons <ArrowRight size={18} /></Link></section></div></PublicShell>;
}
