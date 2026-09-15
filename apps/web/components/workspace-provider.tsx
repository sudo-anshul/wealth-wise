'use client';
import { createContext,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import { workspaceSchema,emptyWorkspace,type Workspace,type SourceMode,type Command } from '@wealthwise/contracts';
import { createDemoWorkspace } from '@wealthwise/demo-data';
import { applyCommand } from '@wealthwise/domain';
type Context={state:Workspace;mode:SourceMode;basePath:'/demo'|'/app';ready:boolean;pending:boolean;error:string|null;dispatch:(command:Command)=>Promise<void>;resetDemo:()=>boolean;reload:()=>Promise<void>};
const WorkspaceContext=createContext<Context|null>(null);
const storageKey='wealthwise.demo.v1';
export function WorkspaceProvider({mode,children}:{mode:SourceMode;children:ReactNode}){
  const [state,setState]=useState<Workspace>(()=>mode==='demo'?createDemoWorkspace():emptyWorkspace());const ref=useRef(state);
  const [ready,setReady]=useState(false);const [pending,setPending]=useState(false);const [error,setError]=useState<string|null>(null);const inFlight=useRef(false);
  function update(next:Workspace){ref.current=next;setState(next);}
  async function reload(){setError(null);try{const response=await fetch('/api/workspace',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error?.message??data.error??'Could not load your workspace.');update(workspaceSchema.parse(data.workspace));}catch(e){setError(e instanceof Error?e.message:'Could not load your workspace.');}finally{setReady(true);}}
  useEffect(()=>{if(mode==='demo'){try{const saved=localStorage.getItem(storageKey);if(saved)update(workspaceSchema.parse(JSON.parse(saved)));}catch{setError('The saved demo could not be read. Reset the demo in Settings to start fresh.');}setReady(true);}else{void reload();}},[mode]); // The mode changes only when moving between isolated layouts.
  async function dispatch(command:Command){
    if(!ready)throw new Error('Your workspace is still loading. Please try again in a moment.');
    if(inFlight.current)throw new Error('Your previous change is still saving. Please try again in a moment.');
    inFlight.current=true;setPending(true);setError(null);
    try{if(mode==='demo'){const next=applyCommand(ref.current,command);localStorage.setItem(storageKey,JSON.stringify(next));update(next);}else{const response=await fetch('/api/commands',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command,expectedVersion:ref.current.version})});const data=await response.json();if(!response.ok){if(response.status===409)await reload();throw new Error(data.error?.message??data.error??'Your change could not be saved.');}update(workspaceSchema.parse(data.workspace));}}
    catch(e){const message=e instanceof Error?e.message:'Your change could not be saved.';setError(message);throw new Error(message);}
    finally{inFlight.current=false;setPending(false);}
  }
  function resetDemo(){if(mode!=='demo')return false;const next=createDemoWorkspace();try{localStorage.setItem(storageKey,JSON.stringify(next));update(next);setError(null);return true;}catch{setError('Browser storage is unavailable. Allow local storage to save demo changes.');return false;}}
  return <WorkspaceContext.Provider value={{state,mode,basePath:mode==='demo'?'/demo':'/app',ready,pending,error,dispatch,resetDemo,reload}}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace(){const context=useContext(WorkspaceContext);if(!context)throw new Error('This view requires a workspace.');return context;}
