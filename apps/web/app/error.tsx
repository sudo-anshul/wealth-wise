'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{maxWidth:720,padding:'100px 24px',margin:'auto'}}><h1 className="serif" style={{fontSize:48}}>A small pause.</h1><p style={{margin:'20px 0'}}>This page could not be loaded. Your saved data has not been changed.</p><button className="button button-primary" onClick={reset}>Try again</button></main>;}
