(() => {
"use strict";
const STORAGE_KEY="grok-bot-company.ledger.v1";
class MissionLedger extends EventTarget{
 constructor(){
  super();this.pipeline=Promise.resolve();this.integrity="ready";this.state=this.read();
  if(!this.state.events)this.state=this.empty();if(this.state.events.length){this.integrity="checking";setTimeout(()=>this.verify(),0)}
 }
 empty(){return{missionId:null,sequence:0,events:[],artifacts:{},policy:null,updatedAt:null}}
 read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch{return this.empty()}}
 persist(){this.state.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state))}catch{}}
 canonical(value){
  if(Array.isArray(value))return"["+value.map(item=>this.canonical(item)).join(",")+"]";
  if(value&&typeof value==="object")return"{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+this.canonical(value[key])).join(",")+"}";
  return JSON.stringify(value);
 }
 async digest(value){
  const bytes=new TextEncoder().encode(value);
  if(globalThis.crypto&&crypto.subtle){const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("")}
  let fallback=2166136261;for(const byte of bytes){fallback^=byte;fallback=Math.imul(fallback,16777619)}return("00000000"+(fallback>>>0).toString(16)).slice(-8).repeat(8);
 }
 emit(type,detail){this.dispatchEvent(new CustomEvent(type,{detail}))}
 enqueue(task){const run=this.pipeline.then(task);this.pipeline=run.catch(()=>{});return run}
 async append(type,data){
  const previousHash=this.state.events.length?this.state.events[this.state.events.length-1].eventHash:"GENESIS";
  const event={eventId:"ledger_"+String(++this.state.sequence).padStart(4,"0"),missionId:this.state.missionId,type,data,timestamp:new Date().toISOString(),previousHash};
  event.eventHash=await this.digest(previousHash+"|"+this.canonical(event));this.state.events.push(event);this.integrity="verified";this.persist();this.emit("event",event);this.emit("change",this.snapshot());return event;
 }
 startMission(missionId){
  return this.enqueue(async()=>{this.state=this.empty();this.state.missionId=missionId;this.integrity="verified";return this.append("mission.started",{missionId})});
 }
 resolveParents(parentIds=[]){return parentIds.map(id=>this.state.artifacts[id]?id:(this.latest(id)||{}).artifactId).filter(Boolean)}
 latest(baseId){return Object.values(this.state.artifacts).filter(a=>a.baseId===baseId).sort((a,b)=>b.version-a.version)[0]||null}
 createArtifact(spec){return this.enqueue(()=>this.create(spec))}
 async create(spec){
  const previous=this.latest(spec.baseId),version=spec.version||((previous&&previous.version||0)+1),parentIds=this.resolveParents(spec.parentIds),payload=spec.payload||{};
  const hash=await this.digest(this.canonical({baseId:spec.baseId,type:spec.type,version,parentIds,payload}));
  const artifact={artifactId:spec.baseId+":v"+version,baseId:spec.baseId,type:spec.type,label:spec.label,createdBy:spec.createdBy,version,parentIds,payload,hash,status:"sealed",audit:null,createdAt:new Date().toISOString()};
  this.state.artifacts[artifact.artifactId]=artifact;
  await this.append("artifact.created",{artifactId:artifact.artifactId,baseId:artifact.baseId,type:artifact.type,version:artifact.version,createdBy:artifact.createdBy,parentIds:artifact.parentIds,hash:artifact.hash});
  this.emit("artifact",artifact);return artifact;
 }
 reviseArtifact(baseId,changes,createdBy){
  return this.enqueue(async()=>{
   const previous=this.latest(baseId);if(!previous)throw new Error("Artifact not found: "+baseId);
   const stale=previous.audit&&previous.audit.status==="passed";previous.status="superseded";
   if(stale){await this.append("audit.invalidated",{artifactId:previous.artifactId,auditHash:previous.audit.artifactHash,reason:"artifact revised"});this.emit("audit-stale",{artifact:previous,reason:"Artifact changed after audit"})}
   const parentIds=Array.from(new Set(previous.parentIds.concat(previous.artifactId))),payload=Object.assign({},previous.payload,changes);
   const artifact=await this.create({baseId,type:previous.type,label:previous.label,createdBy:createdBy||previous.createdBy,parentIds,payload,version:previous.version+1});
   await this.append("artifact.revised",{from:previous.artifactId,to:artifact.artifactId,changedBy:createdBy||previous.createdBy});return artifact;
  });
 }
 auditArtifact(baseId,auditor,checks){
  return this.enqueue(async()=>{
   const artifact=this.latest(baseId);if(!artifact)throw new Error("Artifact not found: "+baseId);
   artifact.audit={status:"passed",auditor,checks,artifactHash:artifact.hash,auditedAt:new Date().toISOString()};
   await this.append("artifact.audited",{artifactId:artifact.artifactId,auditor,checks,artifactHash:artifact.hash});this.persist();this.emit("audit",{artifact});this.emit("change",this.snapshot());return artifact;
  });
 }
 evaluatePolicy(action,baseId){
  return this.enqueue(async()=>{
   const artifact=this.latest(baseId),checks={artifactExists:!!artifact,auditPassed:!!(artifact&&artifact.audit&&artifact.audit.status==="passed"),auditMatchesCurrentHash:!!(artifact&&artifact.audit&&artifact.audit.artifactHash===artifact.hash),hasLineage:!!(artifact&&artifact.parentIds.length)};
   const valid=Object.values(checks).every(Boolean),decision=valid?(action==="publish"?"approval_required":"allowed"):"blocked";
   const policy={action,artifactId:artifact&&artifact.artifactId,checks,decision,evaluatedAt:new Date().toISOString()};this.state.policy=policy;
   await this.append("policy.evaluated",policy);this.emit("policy",policy);return policy;
  });
 }
 recordApproval(decision,operator="human"){
  return this.enqueue(()=>this.append("approval."+decision,{decision,operator,artifactId:(this.latest("brief")||{}).artifactId}));
 }
 verify(){
  return this.enqueue(async()=>{
   let previousHash="GENESIS",valid=true;
   for(const stored of this.state.events){const event={eventId:stored.eventId,missionId:stored.missionId,type:stored.type,data:stored.data,timestamp:stored.timestamp,previousHash};const expected=await this.digest(previousHash+"|"+this.canonical(event));if(stored.previousHash!==previousHash||stored.eventHash!==expected){valid=false;break}previousHash=stored.eventHash}
   this.integrity=valid?"verified":"compromised";this.emit("verified",{integrity:this.integrity});this.emit("change",this.snapshot());return valid;
  });
 }
 snapshot(){return{missionId:this.state.missionId,sequence:this.state.sequence,events:this.state.events.slice(),artifacts:Object.values(this.state.artifacts),policy:this.state.policy,integrity:this.integrity,updatedAt:this.state.updatedAt}}
}
window.MissionLedger=MissionLedger;window.missionLedger=new MissionLedger();
})();
