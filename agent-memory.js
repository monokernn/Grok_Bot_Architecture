(() => {
"use strict";

const STORAGE_KEY="grokbot.architecture.agent-memory.v1";
const SCHEMA_VERSION=1;
const MAX_ENTRIES=240;
const AGENT_IDS=new Set(["helm","scout","forge","archive","sentinel","relay"]);

function clean(value,max=600){return String(value??"").replace(/\s+/g," ").trim().slice(0,max)}
function emptyState(){return{version:SCHEMA_VERSION,createdAt:new Date().toISOString(),updatedAt:null,entries:[]}}
function clone(value){return JSON.parse(JSON.stringify(value))}

class AgentMemoryStore extends EventTarget{
 constructor(){
  super();
  this.storageKey=STORAGE_KEY;
  this.persistent=true;
  this.state=this.load();
 }
 load(){
  try{
   const raw=localStorage.getItem(this.storageKey);
   if(!raw)return emptyState();
   const parsed=JSON.parse(raw);
   if(parsed.version!==SCHEMA_VERSION||!Array.isArray(parsed.entries))return emptyState();
   parsed.entries=parsed.entries.filter(entry=>entry&&AGENT_IDS.has(entry.agentId)&&entry.title&&entry.summary).slice(-MAX_ENTRIES);
   return{...emptyState(),...parsed,version:SCHEMA_VERSION};
  }catch(error){
   this.persistent=false;
   return emptyState();
  }
 }
 persist(){
  this.state.updatedAt=new Date().toISOString();
  try{
   localStorage.setItem(this.storageKey,JSON.stringify(this.state));
   this.persistent=true;
  }catch(error){
   this.persistent=false;
   this.dispatchEvent(new CustomEvent("error",{detail:{message:error.message}}));
  }
 }
 remember(input={}){
  const agentId=clean(input.agentId,24).toLowerCase();
  if(!AGENT_IDS.has(agentId))return null;
  const entry={
   id:globalThis.crypto&&crypto.randomUUID?crypto.randomUUID():"mem_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8),
   agentId,
   missionId:clean(input.missionId||"NS-INT-042",40),
   runId:clean(input.runId||"local",64),
   phase:clean(input.phase||"operation",32).toUpperCase(),
   title:clean(input.title,100),
   summary:clean(input.summary,600),
   tone:clean(input.tone||"cyan",20),
   elapsedMs:Math.max(0,Number(input.elapsedMs)||0),
   createdAt:new Date().toISOString()
  };
  if(!entry.title||!entry.summary)return null;
  this.state.entries.push(entry);
  if(this.state.entries.length>MAX_ENTRIES)this.state.entries.splice(0,this.state.entries.length-MAX_ENTRIES);
  this.persist();
  this.dispatchEvent(new CustomEvent("change",{detail:{type:"write",entry:clone(entry),stats:this.stats()}}));
  return clone(entry);
 }
 recall(agentId,limit=20){
  const id=clean(agentId,24).toLowerCase(),amount=Math.max(1,Math.min(100,Number(limit)||20));
  return this.state.entries.filter(entry=>entry.agentId===id).slice(-amount).reverse().map(clone);
 }
 count(agentId){
  if(!agentId)return this.state.entries.length;
  const id=clean(agentId,24).toLowerCase();
  return this.state.entries.reduce((total,entry)=>total+(entry.agentId===id?1:0),0);
 }
 stats(){
  const agents={};
  AGENT_IDS.forEach(id=>agents[id]=this.count(id));
  return{total:this.count(),activeAgents:Object.values(agents).filter(Boolean).length,agents,lastWrite:this.state.updatedAt,persistent:this.persistent};
 }
 snapshot(){return clone({...this.state,stats:this.stats()})}
 clear(){
  this.state=emptyState();
  this.persist();
  this.dispatchEvent(new CustomEvent("change",{detail:{type:"clear",stats:this.stats()}}));
 }
}

window.agentMemory=new AgentMemoryStore();
})();
