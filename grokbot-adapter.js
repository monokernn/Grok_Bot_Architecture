(() => {
"use strict";
const STORAGE_KEY="grok-bot-company.transport.v1";
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class GrokBotAdapter extends EventTarget{
 constructor(options={}){
  super();const saved=this.read();this.mode=options.mode||"mock";this.status="offline";
  this.sessionId=saved.sessionId||this.createId("session");this.sequence=saved.sequence||0;this.startedAt=Date.now();
  this.lastHeartbeat=0;this.lastAck=null;this.outbox=[];this.telemetry=saved.telemetry||[];this.mission=saved.mission||null;this.connecting=null;this.heartbeatTimer=0;
 }
 createId(prefix){const value=globalThis.crypto&&crypto.randomUUID?crypto.randomUUID().replaceAll("-","").slice(0,12):Math.random().toString(16).slice(2,14);return prefix+"_"+value}
 read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch{return{}}}
 persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({sessionId:this.sessionId,sequence:this.sequence,mission:this.mission,telemetry:this.telemetry.slice(0,40)}))}catch{}}
 emit(type,detail={}){this.dispatchEvent(new CustomEvent(type,{detail:Object.assign({mode:this.mode,status:this.status,sessionId:this.sessionId},detail)}))}
 async connect(){
  if(this.status==="online")return this.snapshot();if(this.connecting)return this.connecting;this.status="connecting";this.emit("connection");
  this.connecting=(async()=>{await wait(420+Math.random()*420);this.status="online";this.lastHeartbeat=Date.now();this.startHeartbeat();this.persist();this.emit("connection",{rtt:Math.round(38+Math.random()*34)});this.connecting=null;return this.snapshot()})();
  return this.connecting;
 }
 disconnect(){clearInterval(this.heartbeatTimer);this.status="offline";this.emit("connection")}
 startHeartbeat(){clearInterval(this.heartbeatTimer);this.heartbeatTimer=setInterval(()=>{this.lastHeartbeat=Date.now();this.emit("heartbeat",{rtt:Math.round(31+Math.random()*43),queueDepth:this.outbox.length,uptime:Date.now()-this.startedAt})},2200)}
 async command(name,payload={}){
  if(this.status!=="online")await this.connect();
  const envelope={id:this.createId("cmd"),sequence:++this.sequence,name,payload,createdAt:new Date().toISOString()};this.outbox.push(envelope);this.emit("queue",{depth:this.outbox.length,command:name});
  const latency=Math.round(85+Math.random()*210);await wait(latency);this.outbox=this.outbox.filter(item=>item.id!==envelope.id);
  const ack={commandId:envelope.id,sequence:envelope.sequence,name,status:"accepted",latency,acknowledgedAt:new Date().toISOString()};this.lastAck=ack;this.persist();this.emit("ack",ack);return ack;
 }
 startMission(payload){this.mission={id:payload.id,state:"running",objective:payload.objective,startedAt:new Date().toISOString()};this.persist();return this.command("mission.start",payload)}
 setMissionState(next){if(this.mission)this.mission.state=next;this.persist();return this.command("mission."+next,{missionId:this.mission&&this.mission.id})}
 resetMission(){this.mission=null;this.persist();return this.command("mission.reset",{})}
 requestApproval(payload){if(this.mission)this.mission.state="waiting_approval";this.persist();return this.command("approval.request",payload)}
 resolveApproval(decision){if(this.mission)this.mission.state=decision==="approved"?"complete":"revision";this.persist();return this.command("approval.resolve",{missionId:this.mission&&this.mission.id,decision})}
 recordEvent(payload){const packet=Object.assign({packetId:this.createId("evt"),receivedAt:new Date().toISOString()},payload);this.telemetry.unshift(packet);this.telemetry=this.telemetry.slice(0,40);this.persist();this.emit("telemetry",packet);return packet}
 snapshot(){return{mode:this.mode,status:this.status,sessionId:this.sessionId,mission:this.mission,queueDepth:this.outbox.length,lastHeartbeat:this.lastHeartbeat,lastAck:this.lastAck}}
}
window.GrokBotAdapter=GrokBotAdapter;window.grokBot=new GrokBotAdapter({mode:"mock"});
})();
