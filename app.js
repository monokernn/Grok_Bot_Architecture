(() => {
"use strict";
const $=s=>document.querySelector(s), canvas=$("#stationCanvas"), ctx=canvas.getContext("2d");
const C={helm:"#ef5a52",forge:"#eda63a",sentinel:"#8d74d6",scout:"#a6cf58",archive:"#50bcb5",relay:"#4e91cf",green:"#a6cf58",amber:"#c99b3b",red:"#ef5a52",cyan:"#50bcb5",muted:"#747474"};
const zones=[
 {id:"bridge",name:"COMMAND DESK",x:65,y:115,w:200,h:125,color:C.helm,type:"bridge"},
 {id:"build",name:"BUILD DESK",x:350,y:115,w:210,h:125,color:C.forge,type:"build"},
 {id:"audit",name:"AUDIT DESK",x:645,y:115,w:195,h:125,color:C.sentinel,type:"audit"},
 {id:"skill",name:"SIGNAL DESK",x:65,y:335,w:200,h:135,color:C.scout,type:"skill"},
 {id:"vault",name:"ARCHIVE DESK",x:350,y:335,w:210,h:135,color:C.archive,type:"vault"},
 {id:"airlock",name:"RELEASE DESK",x:645,y:335,w:195,h:135,color:C.relay,type:"airlock"}
];
const points={bridge:{x:165,y:210},build:{x:455,y:210},audit:{x:740,y:210},skill:{x:165,y:430},vault:{x:455,y:430},airlock:{x:740,y:430},core:{x:455,y:292},monitor:{x:500,y:92},library:{x:82,y:292},printer:{x:310,y:300},lounge:{x:755,y:292},server:{x:835,y:350}};
const initial=[
 {id:"helm",name:"Helm",letter:"H",role:"Chief of Staff",color:C.helm,state:"idle",task:"Awaiting mission",zone:"bridge",x:165,y:210,tx:165,ty:210},
 {id:"forge",name:"Forge",letter:"F",role:"Lead Product Engineer",color:C.forge,state:"idle",task:"Systems standing by",zone:"build",x:455,y:210,tx:455,ty:210},
 {id:"sentinel",name:"Sentinel",letter:"S",role:"QA & Safety Auditor",color:C.sentinel,state:"idle",task:"Monitoring controls",zone:"audit",x:740,y:210,tx:740,ty:210},
 {id:"scout",name:"Scout",letter:"S",role:"Research Specialist",color:C.scout,state:"idle",task:"Watching signals",zone:"skill",x:165,y:430,tx:165,ty:430},
 {id:"archive",name:"Archive",letter:"A",role:"Memory & Artifacts",color:C.archive,state:"idle",task:"Vault synchronized",zone:"vault",x:455,y:430,tx:455,ty:430},
 {id:"relay",name:"Relay",letter:"R",role:"External Operations",color:C.relay,state:"idle",task:"Airlock standing by",zone:"airlock",x:740,y:430,tx:740,ty:430}
];
let agents=initial.map(a=>({...a}));
const state={running:false,paused:false,approval:false,complete:false,rejected:false,elapsed:0,duration:300000,last:performance.now(),cursor:0,speed:1,count:0,spend:.42,artifacts:0,particles:[],selected:"helm",ambientAt:performance.now()+1800};
const stages=["scope","research","synthesis","evidence","review","release"];
const timeline=[
 {at:1000,run(){event("helm","Mission opened","NS-INT-042 received: produce a decision-ready 2026 competitor brief.","cyan");agent("helm","working","breaking down request","bridge");stage("scope",1,"Scoping the intelligence mission","Helm is defining questions, owners, evidence rules, and the release boundary.")}},
 {at:12000,run(){event("helm","Work graph created","Five workstreams, 24-source target, and one approval gate assigned.","green");agent("helm","delegating","routing research scope","core");agent("scout","working","receiving research brief","core")}},
 {at:28000,run(){event("scout","Discovery started","Search plan expanded across product, hiring, pricing, and customer signals.","cyan");agent("helm","idle","watching dependency graph","lounge");agent("scout","working","reading source index","monitor");stage("research",9,"Research sweep in progress","Scout is collecting first-party sources and labeling confidence.")}},
 {at:47000,run(){event("scout","Source batch verified","Six primary links passed freshness and provenance checks.","green");agent("scout","working","sourced 6 links","library");state.artifacts=2}},
 {at:65000,run(){event("scout","Pricing evidence captured","Three plan changes and two packaging shifts added to the source ledger.","cyan");agent("scout","working","reading pricing pages","skill");state.artifacts=4}},
 {at:84000,run(){event("scout","Research pack ready","24 sources collected; 17 claims marked high confidence.","green");agent("scout","delegating","handing off 24 sources","core");agent("forge","working","receiving source pack","core");stage("synthesis",28,"Evidence is moving to synthesis","Scout and Forge are transferring the verified research pack.")}},
 {at:103000,run(){event("forge","Claim map started","Entities, products, dates, and claims normalized into one schema.","cyan");agent("scout","complete","research pack delivered","skill");agent("forge","working","mapping 12 entities","build")}},
 {at:124000,run(){event("forge","Contradiction detected","Two revenue claims conflict; both retained with confidence notes.","amber");agent("forge","working","resolving 2 conflicts","printer")}},
 {at:145000,run(){event("forge","Synthesis complete","Draft now contains 8 findings, 3 risks, and 5 strategic moves.","green");agent("forge","working","rendering 12-page brief","build");state.artifacts=9}},
 {at:162000,run(){event("forge","Evidence bundle prepared","Brief, claim map, and source ledger packaged for persistence.","cyan");agent("forge","delegating","handing off evidence pack","core");agent("archive","working","receiving 18 artifacts","core");stage("evidence",54,"Evidence pack is being secured","Forge and Archive are transferring traceable mission artifacts.")}},
 {at:181000,run(){event("archive","Index write started","Content hashes and citation backlinks are being generated.","cyan");agent("forge","complete","synthesis delivered","build");agent("archive","working","writing evidence index","server")}},
 {at:199000,run(){event("archive","Artifacts indexed","18 artifacts stored with source-level lineage and rollback metadata.","green");agent("archive","working","indexed 18 artifacts","vault");state.artifacts=18}},
 {at:215000,run(){event("sentinel","Independent audit started","Citation coverage, claim support, and release rules loaded.","violet");agent("archive","idle","evidence vault synced","library");agent("sentinel","reviewing","cross-checking 24 citations","audit");stage("review",71,"Independent audit in progress","Sentinel is testing every material claim against the evidence ledger.")}},
 {at:236000,run(){event("sentinel","Automated checks passed","12 of 12 structural and safety checks are green.","green");agent("sentinel","reviewing","running final checks","monitor")}},
 {at:252000,run(){event("sentinel","One warning resolved","A duplicate market-size claim was removed from the executive summary.","amber");agent("sentinel","reviewing","verifying corrected claim","audit")}},
 {at:267000,run(){event("sentinel","Audit passed","All material claims have citations; no blocking issue remains.","green");agent("sentinel","complete","audit passed: 12/12","audit");agent("helm","working","assembling decision packet","core");agent("relay","working","receiving approved draft","core");stage("release",89,"Preparing the controlled release","Helm and Relay are assembling the final decision packet.")}},
 {at:281000,run(){event("relay","Release packet staged","12-page brief and evidence links are ready at the approval boundary.","cyan");agent("helm","waiting approval","decision packet ready","lounge");agent("relay","waiting approval","awaiting final yes","airlock")}},
 {at:290000,run(){event("relay","Human decision requested","Publication is paused at the Approval Airlock.","amber");stage("release",97,"Final approval required","The complete intelligence brief is waiting for one human decision.");requestApproval()}}
];
function renderRoster(){
 $("#agentRoster").innerHTML=agents.map(a=>'<article class="agent-card '+(state.selected===a.id?"selected":"")+'" data-id="'+a.id+'" style="--agent:'+a.color+'"><div class="avatar">'+a.letter+'</div><div class="agent-head"><b>'+a.name.toUpperCase()+'</b><span>'+a.state+'</span></div><div class="agent-role">'+a.role+'</div><div class="agent-task"><i></i>'+a.task+'</div></article>').join("");
 document.querySelectorAll(".agent-card").forEach(n=>n.onclick=()=>select(n.dataset.id));
}
function select(id){
 state.selected=id; renderRoster();
 const a=agents.find(x=>x.id===id), box=$("#selection");
 box.querySelector("span").textContent="SELECTED AGENT · "+a.state.toUpperCase();
 box.querySelector("b").textContent=a.name.toUpperCase();
 box.querySelector("p").textContent=a.task+". Current zone: "+zoneName(a.zone)+".";
 box.style.borderColor=a.color; box.querySelector("span").style.color=a.color;
}
function zoneName(id){const special={core:"Transit Core",monitor:"Floor Monitor",library:"Source Library",printer:"Document Printer",lounge:"Decision Lounge",server:"Server Rack"};if(special[id])return special[id];const z=zones.find(x=>x.id===id);return z?z.name:id}
function navigate(a,x,y){
 const path=[],sourceGap=a.x<330?310:a.x>620?610:(a.x<455?310:610),targetGap=x<330?310:x>620?610:(x<455?310:610);
 if(a.y>330){path.push({x:sourceGap,y:a.y},{x:sourceGap,y:292})}
 else if(a.y<150){path.push({x:sourceGap,y:a.y},{x:sourceGap,y:292})}
 else if(a.y<250&&y>250){path.push({x:a.x,y:292})}
 if(y>330)path.push({x:targetGap,y:292},{x:targetGap,y});
 else if(y<150)path.push({x:targetGap,y:292},{x:targetGap,y});
 path.push({x,y});a.path=path.filter((p,i,list)=>!i||p.x!==list[i-1].x||p.y!==list[i-1].y);const next=a.path.shift();a.tx=next.x;a.ty=next.y;
}
function agent(id,status,task,zone){
 const a=agents.find(x=>x.id===id); if(!a)return;
 a.state=status;a.task=task;a.activity=task;a.returnAt=0;
 if(zone&&points[zone]){a.zone=zone;const offsets={helm:-55,scout:55,forge:-55,archive:55,sentinel:-55,relay:55},x=points[zone].x+(zone==="core"?offsets[id]||0:0),y=points[zone].y+(zone==="core"&&(id==="scout"||id==="archive"||id==="relay")?8:0);navigate(a,x,y);burst(a.x,a.y,a.color,6)}
 renderRoster();if(state.selected===id)select(id);
}
function event(actor,title,message,tone){
 const colors={cyan:C.cyan,green:C.green,amber:C.amber,red:C.red,violet:C.sentinel};
 const el=document.createElement("article"),time=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());
 el.className="event";el.style.setProperty("--tone",colors[tone]||C.cyan);
 el.innerHTML='<i></i><div><b>'+actor+'</b><time>'+time+'</time></div><p><strong>'+title+'.</strong> '+message+'</p>';
 $("#eventFeed").prepend(el);state.count++;$("#eventCount").textContent=String(state.count).padStart(2,"0")+" EVENTS";
}
function formatDuration(ms){const total=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(total/60),s=total%60;return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
function stage(name,progress,title,sub){
 $("#progressBar").style.width=progress+"%";$("#progressLabel").textContent=progress===100?"100% · COMPLETE":progress+"% · "+formatDuration(state.duration-state.elapsed)+" left";$("#missionTitle").textContent=title;$("#missionSub").textContent=sub;
 const current=stages.indexOf(name);document.querySelectorAll("#stages span").forEach((n,i)=>{n.classList.toggle("active",i===current);n.classList.toggle("done",i<current)});
}
function requestApproval(){
 state.approval=true;state.running=false;$("#approvalIdle").hidden=true;$("#approvalRequest").hidden=false;
 $("#airlockMetric").textContent="01 WAITING";$("#airlockMetric").style.color=C.red;$("#riskBadge").textContent="APPROVAL HOLD";$("#riskBadge").style.color=C.red;burst(points.airlock.x,points.airlock.y,C.red,28);
}
function resolve(ok){
 if(!state.approval)return;state.approval=false;$("#approvalIdle").hidden=false;$("#approvalRequest").hidden=true;$("#airlockMetric").textContent="CLEAR";$("#airlockMetric").style.color="";
 if(ok){event("operator","Action approved","The intelligence brief passed through the Approval Airlock.","green");agent("relay","complete","release approved","airlock");agent("helm","complete","mission completed","bridge");stage("release",100,"Mission complete","Six agents produced an audited brief with a traceable evidence record.");$("#riskBadge").textContent="COMPLETED";$("#riskBadge").style.color=C.green;state.complete=true;state.spend=4.07;$("#spendMetric").textContent="$4.07";setTimeout(()=>event("helm","Mission completed","NS-INT-042 closed with a clean evidence record.","green"),500);burst(points.bridge.x,points.bridge.y,C.green,24)}
 else{state.rejected=true;event("operator","Action rejected","Publication blocked; all artifacts remain reversible in the Vault.","red");agent("relay","idle","release cancelled","airlock");agent("helm","working","revising release plan","bridge");agent("forge","working","preparing private revision","build");stage("synthesis",48,"Returned for revision","The external action was rejected; the evidence pack remains intact.");$("#riskBadge").textContent="REVISION";$("#riskBadge").style.color=C.amber}
}
function start(){
 if(state.complete||state.rejected||state.cursor>=timeline.length)reset(false);if(state.approval)return;
 state.running=true;state.paused=false;$("#startBtn").textContent="● Mission running";event("system","Simulation started","Grok Bot Company event loop is active.","cyan");
}
function pause(){
 if(state.approval||state.complete)return;state.paused=!state.paused;state.running=!state.paused;$("#pauseBtn").textContent=state.paused?"▶":"Ⅱ";event("system",state.paused?"Simulation paused":"Simulation resumed",state.paused?"Timeline execution is holding.":"Timeline execution continues.","amber");
}
function reset(announce=true){
 state.running=false;state.paused=false;state.approval=false;state.complete=false;state.rejected=false;state.elapsed=0;state.cursor=0;state.artifacts=0;state.spend=.42;agents=initial.map(a=>({...a}));
 $("#approvalIdle").hidden=false;$("#approvalRequest").hidden=true;$("#airlockMetric").textContent="CLEAR";$("#airlockMetric").style.color="";$("#spendMetric").textContent="$0.42";$("#riskBadge").textContent="LOW RISK";$("#riskBadge").style.color="";$("#startBtn").textContent="▶ Start mission";$("#pauseBtn").textContent="Ⅱ";
 stage(null,0,"Build the 2026 competitor intelligence brief","Research 24 sources, map claims, build an evidence pack, audit, and prepare release.");document.querySelectorAll("#stages span").forEach(n=>n.classList.remove("active","done"));renderRoster();select("helm");if(announce)event("system","Mission reset","All agents returned to their stations; the five-minute clock is ready.","amber");
}
function burst(x,y,color,count){for(let i=0;i<count;i++)state.particles.push({x,y,color,life:1,dx:(Math.random()-.5)*2.8,dy:(Math.random()-.5)*2.8})}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);ctx.setTransform(d,0,0,d,0,0);ctx.imageSmoothingEnabled=false}
function transform(){const w=canvas.clientWidth,h=canvas.clientHeight,s=Math.min(w/900,h/540);return{s,ox:(w-900*s)/2,oy:(h-540*s)/2}}
function panel(x,y,w,h,fill,stroke){const q=9;ctx.beginPath();ctx.moveTo(x+q,y);ctx.lineTo(x+w-q,y);ctx.lineTo(x+w,y+q);ctx.lineTo(x+w,y+h-q);ctx.lineTo(x+w-q,y+h);ctx.lineTo(x+q,y+h);ctx.lineTo(x,y+h-q);ctx.lineTo(x,y+q);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke()}
function backdrop(){
 ctx.fillStyle="#070c11";ctx.fillRect(0,0,900,540);ctx.strokeStyle="#577c8b16";ctx.lineWidth=1;
 for(let x=20;x<900;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke()}for(let y=20;y<540;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke()}
 for(let i=0;i<80;i++){const x=i*137%900,y=i*83%540;ctx.fillStyle=i%7?"#ffffff0b":"#8b928b24";ctx.fillRect(x,y,i%7?1:2,i%7?1:2)}
}
function connectors(){
 const p=points.core;ctx.lineWidth=8;ctx.strokeStyle="#101923";
 zones.forEach(z=>{const q=points[z.id];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()});
 ctx.lineWidth=1;ctx.setLineDash([3,9]);ctx.strokeStyle="#747a7430";zones.forEach(z=>{const q=points[z.id];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()});ctx.setLineDash([]);
}
function drawZone(z){
 const active=agents.some(a=>a.zone===z.id&&a.state!=="idle");panel(z.x,z.y,z.w,z.h,active?"#101110f7":"#0a0b0af2",active?z.color:"#303230");
 ctx.fillStyle=active?z.color:"#53616b";ctx.font="bold 10px monospace";ctx.fillText(z.name,z.x+13,z.y+20);ctx.fillStyle=active?z.color:"#27343e";ctx.fillRect(z.x+12,z.y+29,z.w-24,2);
 details(z,active);ctx.fillStyle=active?z.color:"#3a4853";for(let i=0;i<3;i++)ctx.fillRect(z.x+z.w-18-i*8,z.y+14,4,4);
}
function details(z,active){
 if(z.type==="bridge"){ctx.fillStyle="#172530";ctx.fillRect(z.x+22,z.y+52,72,35);ctx.fillRect(z.x+126,z.y+52,72,35);ctx.fillStyle="#284858";ctx.fillRect(z.x+27,z.y+57,62,18);ctx.fillRect(z.x+131,z.y+57,62,18);ctx.fillStyle=C.helm;ctx.fillRect(z.x+34,z.y+62,24,3);ctx.fillRect(z.x+138,z.y+62,42,3);ctx.fillStyle="#19222a";ctx.fillRect(z.x+35,z.y+105,150,18)}
 if(z.type==="build"){for(let i=0;i<3;i++){ctx.fillStyle="#182832";ctx.fillRect(z.x+24+i*67,z.y+48,48,54);ctx.fillStyle=i===1?C.cyan:"#2d5363";ctx.fillRect(z.x+29+i*67,z.y+54,38,22);ctx.fillStyle="#7ee8dc";ctx.fillRect(z.x+33+i*67,z.y+59,19,3)}ctx.fillStyle="#1c2e38";ctx.fillRect(z.x+44,z.y+116,143,12)}
 if(z.type==="audit"){ctx.strokeStyle="#4f406c";ctx.lineWidth=4;ctx.strokeRect(z.x+22,z.y+48,166,64);ctx.fillStyle="#161d2a";ctx.fillRect(z.x+28,z.y+54,154,52);[46,88,66,112,92].forEach((w,i)=>{ctx.fillStyle=C.sentinel;ctx.fillRect(z.x+38,z.y+61+i*8,w,2)})}
 if(z.type==="skill"){ctx.fillStyle="#2b2418";ctx.fillRect(z.x+22,z.y+49,176,71);ctx.fillStyle=C.amber;ctx.fillRect(z.x+32,z.y+61,38,38);ctx.fillStyle="#0d1115";ctx.fillRect(z.x+38,z.y+67,26,26);for(let i=0;i<4;i++){ctx.fillStyle=i%2?C.orange:"#66502a";ctx.fillRect(z.x+92+i*23,z.y+67,13,30)}}
 if(z.type==="vault"){ctx.fillStyle="#13271f";ctx.fillRect(z.x+37,z.y+45,156,79);ctx.strokeStyle="#315e48";ctx.lineWidth=3;ctx.strokeRect(z.x+43,z.y+51,144,67);for(let i=0;i<6;i++){ctx.fillStyle=i<Math.max(2,state.artifacts+1)?C.green:"#284237";ctx.fillRect(z.x+55+i*21,z.y+67,10,32)}}
 if(z.type==="airlock"){const x=z.x+z.w/2,y=z.y+84;ctx.strokeStyle=state.approval?C.red:active?z.color:"#3b3940";ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,40,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,27,0,Math.PI*2);ctx.stroke();ctx.fillStyle=state.approval?C.red:"#29313a";ctx.fillRect(x-3,y-30,6,60);ctx.fillRect(x-30,y-3,60,6)}
}
function core(){
 const p=points.core,pulse=5+Math.sin(performance.now()/350)*2;ctx.fillStyle="#4ee7e20f";ctx.beginPath();ctx.arc(p.x,p.y,64+pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#24424b";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,48,0,Math.PI*2);ctx.stroke();ctx.setLineDash([3,6]);ctx.strokeStyle=C.cyan;ctx.beginPath();ctx.arc(p.x,p.y,36,performance.now()/1200,performance.now()/1200+Math.PI*1.5);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#0d171d";ctx.beginPath();ctx.arc(p.x,p.y,25,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.cyan;ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.fillText("EVENT",p.x,p.y-2);ctx.fillText("CORE",p.x,p.y+10);ctx.textAlign="left";
}
function room(){
 ctx.fillStyle="#0b0b0a";ctx.fillRect(0,0,900,540);
 ctx.fillStyle="#12110f";ctx.fillRect(0,0,900,108);ctx.fillStyle="#2b2118";ctx.fillRect(0,101,900,8);
 ctx.strokeStyle="#241e18";ctx.lineWidth=1;for(let y=109;y<540;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke()}for(let x=0;x<900;x+=70){ctx.beginPath();ctx.moveTo(x,109);ctx.lineTo(x+25,540);ctx.stroke()}
 drawWindow(24,18,142,58);drawWindow(180,18,142,58);drawWallMonitor(345,16,250,67);drawClock(746,45);
 ctx.fillStyle="#080908";ctx.fillRect(0,88,900,13);ctx.fillStyle="#77736a";ctx.font="bold 7px monospace";ctx.fillText("GROK BOT COMPANY · ONE HUMAN · SIX BOTS · FLOOR STATUS: NOMINAL",25,97);
 [165,455,740].forEach(x=>{ctx.fillStyle="#d7c28b10";ctx.beginPath();ctx.moveTo(x-13,109);ctx.lineTo(x-82,320);ctx.lineTo(x+82,320);ctx.closePath();ctx.fill();ctx.fillStyle="#6c5c3b";ctx.fillRect(x-17,106,34,5)});
 ctx.fillStyle="#15130f";ctx.fillRect(280,260,350,65);ctx.strokeStyle="#37312a";ctx.strokeRect(280,260,350,65);
 ctx.fillStyle="#746958";ctx.font="bold 8px monospace";ctx.fillText("COMMON HANDOFF FLOOR",290,274);
}
function drawWindow(x,y,w,h){const now=performance.now();ctx.fillStyle="#080b0e";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#292b2a";ctx.strokeRect(x,y,w,h);ctx.fillStyle="#d8d8d0";ctx.beginPath();ctx.arc(x+w-24,y+18,8,0,Math.PI*2);ctx.fill();for(let i=0;i<24;i++){const bx=x+6+(i*37%(w-12)),bh=5+(i*11%23),lit=Math.sin(now/650+i*2.7)>.22;ctx.fillStyle=lit?(i%4?"#73794b":"#a99c55"):"#333724";ctx.fillRect(bx,y+h-bh-4,3,bh)}}
function drawWallMonitor(x,y,w,h){const now=performance.now(),phase=now/720;ctx.fillStyle="#080b0c";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#292d2d";ctx.strokeRect(x,y,w,h);ctx.strokeStyle="#1e2928";ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+8,y+15+i*11);ctx.lineTo(x+w-8,y+15+i*11);ctx.stroke()}ctx.save();ctx.beginPath();ctx.rect(x+8,y+17,w-16,h-22);ctx.clip();ctx.strokeStyle="#6f9f82";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<28;i++){const px=x+9+i*9-(now/70%9),py=y+43-Math.sin(i*.63+phase)*10-Math.sin(i*.19+phase*.45)*7;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();ctx.strokeStyle="#526f8d";ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<28;i++){const px=x+9+i*9-(now/105%9),py=y+49-Math.cos(i*.48+phase*.72)*8;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();ctx.fillStyle="#a6cf58";ctx.fillRect(x+10+(now/9%(w-25)),y+21,2,38);ctx.restore();ctx.fillStyle="#696d68";ctx.font="7px monospace";ctx.fillText("FLOOR MONITOR / LIVE THROUGHPUT",x+10,y+13)}
function drawClock(x,y){const now=new Date(),seconds=now.getSeconds()+now.getMilliseconds()/1000,minutes=now.getMinutes()+seconds/60,hours=now.getHours()%12+minutes/60,hand=(angle,length,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(angle)*length,y-Math.cos(angle)*length);ctx.stroke()};ctx.fillStyle="#d7d2b9";ctx.beginPath();ctx.arc(x,y,31,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#534936";ctx.lineWidth=6;ctx.stroke();ctx.fillStyle="#665d49";for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.fillRect(x+Math.sin(a)*23-1,y-Math.cos(a)*23-1,2,2)}hand(hours*Math.PI/6,15,3,"#332c20");hand(minutes*Math.PI/30,21,2,"#332c20");hand(seconds*Math.PI/30,23,1,C.red);ctx.fillStyle="#332c20";ctx.fillRect(x-2,y-2,4,4)}
function furniture(){
 zones.forEach(desk);meetingTable();serverRack(865,278);plant(40,290);plant(850,492);
 ctx.fillStyle="#233137";ctx.fillRect(292,285,18,35);ctx.fillStyle="#52646a";ctx.fillRect(295,279,12,8);
}
function desk(z){
 const p=points[z.id],x=p.x-z.w/2+16,y=p.y-76,w=z.w-32;
 ctx.fillStyle="#211b15";ctx.fillRect(x,y,w,55);ctx.strokeStyle="#493928";ctx.strokeRect(x,y,w,55);
 ctx.fillStyle="#4a3724";ctx.fillRect(x-5,y+38,w+10,9);ctx.fillStyle="#2c2118";ctx.fillRect(x,y+47,w,16);
 for(let i=0;i<5;i++){ctx.fillStyle=i%2?z.color:"#6b5740";ctx.fillRect(x+8+i*25,y+24-(i%3)*5,16,4+(i%3)*5)}
 ctx.fillStyle="#111719";ctx.fillRect(x+12,y-4,48,28);ctx.strokeStyle="#2c3738";ctx.strokeRect(x+12,y-4,48,28);ctx.fillStyle=z.color;ctx.fillRect(x+18,y+3,30,3);ctx.fillRect(x+18+(performance.now()/35%28),y+9,2,9);ctx.fillStyle=z.color+"88";ctx.fillRect(x+18,y+17,8+(performance.now()/120%21),2);
 ctx.fillStyle="#17130f";ctx.fillRect(x+w-54,y+5,42,25);ctx.fillStyle="#d0cbc0";ctx.fillRect(x+w-48,y+9,12,14);ctx.fillStyle="#8f8b82";ctx.fillRect(x+w-32,y+12,14,11);
 ctx.fillStyle="#080908";ctx.fillRect(p.x-45,p.y+20,90,14);ctx.fillStyle="#c4c4bd";ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.fillText(z.name,p.x,p.y+30);ctx.textAlign="left";
}
function meetingTable(){
 const p=points.core;ctx.fillStyle="#191511";ctx.fillRect(p.x-82,p.y-33,164,62);ctx.strokeStyle="#51402e";ctx.strokeRect(p.x-82,p.y-33,164,62);ctx.fillStyle="#3b2c20";ctx.fillRect(p.x-72,p.y-23,144,42);
 ctx.fillStyle="#d3ccba";ctx.fillRect(p.x-22,p.y-17,18,25);ctx.fillStyle="#918b80";ctx.fillRect(p.x+4,p.y-13,22,21);
 ctx.fillStyle="#9f8b57";ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.fillText("HANDOFF TABLE",p.x,p.y+20);ctx.textAlign="left";
}
function serverRack(x,y){ctx.fillStyle="#101415";ctx.fillRect(x-22,y,32,145);ctx.strokeStyle="#333b3b";ctx.strokeRect(x-22,y,32,145);for(let i=0;i<11;i++){ctx.fillStyle=i%3===0?C.green:"#263232";ctx.fillRect(x-16,y+8+i*12,4,3);ctx.fillStyle="#343b3c";ctx.fillRect(x-7,y+8+i*12,10,3)}}
function plant(x,y){ctx.fillStyle="#4a3524";ctx.fillRect(x-9,y+22,18,16);ctx.fillStyle="#314b32";ctx.fillRect(x-3,y,6,25);ctx.fillRect(x-14,y+4,12,6);ctx.fillRect(x+2,y+8,14,6);ctx.fillRect(x-10,y-5,9,8)}
function drawAgent(a){
 const x=Math.round(a.x),y=Math.round(a.y),moving=Math.hypot(a.tx-a.x,a.ty-a.y)>2,stride=moving?(Math.sin(performance.now()/95+a.x)>.0?2:-2):0;
 ctx.globalAlpha=.14;ctx.fillStyle=a.color;ctx.fillRect(x-18,y+20,36,4);ctx.globalAlpha=1;
 ctx.fillStyle=a.color;ctx.fillRect(x-9,y-20,18,3);ctx.fillRect(x-13,y-17,26,5);ctx.fillRect(x-16,y-12,32,24);
 ctx.fillRect(x-16+stride,y+12,7,8);ctx.fillRect(x-4,y+12,8,6);ctx.fillRect(x+9-stride,y+12,7,8);
 ctx.fillStyle="#101010";ctx.fillRect(x-9,y-8,5,7);ctx.fillRect(x+4,y-8,5,7);
 if(moving){ctx.globalAlpha=.4;ctx.fillStyle=a.color;for(let i=0;i<5;i++)ctx.fillRect(x-23-i*7,y+12+(i%2)*3,2,2);ctx.globalAlpha=1}
 const status=a.state==="waiting approval"?C.red:a.state==="complete"?C.green:a.state==="idle"?"#555":a.color;ctx.fillStyle=status;ctx.fillRect(x+16,y-19,5,5);
 ctx.fillStyle="#080808ed";ctx.fillRect(x-31,y+27,62,13);ctx.fillStyle="#e0e0da";ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.fillText(a.name.toUpperCase(),x,y+36);
 if(a.state!=="idle"||a.activity){const raw=(a.activity||a.task).toLowerCase(),label=raw.length>27?raw.slice(0,26)+"…":raw;ctx.font="7px monospace";const bw=Math.min(128,ctx.measureText(label).width+14);ctx.fillStyle="#070807f2";ctx.fillRect(x-bw/2,y+42,bw,14);ctx.strokeStyle=a.color+"99";ctx.strokeRect(x-bw/2+.5,y+42.5,bw-1,13);ctx.fillStyle=a.color;ctx.fillText(label,x,y+52)}
 ctx.textAlign="left";
}
function particles(){state.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);p.x+=p.dx;p.y+=p.dy;p.life-=.025});ctx.globalAlpha=1;state.particles=state.particles.filter(p=>p.life>0)}
function move(dt){agents.forEach(a=>{const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(d>1){const step=Math.min(d,dt*.11);a.x+=dx/d*step;a.y+=dy/d*step;if(Math.random()<.07)state.particles.push({x:a.x,y:a.y+18,color:a.color,life:.35,dx:0,dy:.3})}else if(a.path&&a.path.length){const next=a.path.shift();a.tx=next.x;a.ty=next.y}})}
function ambient(now){
 const phrases={helm:["checking dependencies","watching floor status"],forge:["checking build queue","fetching component spec"],sentinel:["sampling event logs","checking safety rules"],scout:["scanning signal board","reading source notes"],archive:["checking artifact hashes","syncing source ledger"],relay:["checking approval queue","staging delivery route"]};
 const walkSpots=[points.library,points.printer,points.lounge,{x:245,y:292},{x:650,y:292},{x:245,y:495},{x:610,y:495},{x:500,y:102}];
 agents.forEach(a=>{if(a.returnAt&&now>a.returnAt&&a.state==="idle"){const h=points[a.zone]||points.bridge;navigate(a,h.x,h.y);a.activity="";a.returnAt=0}});
 if(now<state.ambientAt)return;const idle=agents.filter(a=>a.state==="idle"&&a.zone!=="core"&&!a.returnAt);if(idle.length){const a=idle[Math.floor(Math.random()*idle.length)],spot=walkSpots[Math.floor(Math.random()*walkSpots.length)];navigate(a,spot.x+(Math.random()-.5)*24,spot.y+(Math.random()-.5)*18);a.activity=phrases[a.id][Math.floor(Math.random()*phrases[a.id].length)];a.returnAt=now+5000+Math.random()*4500}state.ambientAt=now+1300+Math.random()*1700;
}
function interactions(){
 agents.forEach(a=>{if(a.state==="working"||a.state==="reviewing"){ctx.fillStyle="#080908e8";ctx.fillRect(a.x-15,a.y-37,30,11);ctx.fillStyle=a.color;for(let i=0;i<3;i++)ctx.fillRect(a.x-7+i*7,a.y-33,3,3)}});
 for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++){const a=agents[i],b=agents[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<122&&(a.zone==="core"||b.zone==="core")){const x=(a.x+b.x)/2,y=Math.min(a.y,b.y)-43,t=(performance.now()/1100)%1,px=a.x+(b.x-a.x)*t,py=a.y-15+(b.y-a.y)*t;ctx.strokeStyle="#8b8069";ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(a.x,a.y-15);ctx.lineTo(b.x,b.y-15);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#e0cf8a";ctx.fillRect(px-3,py-3,6,6);ctx.fillStyle="#080908";ctx.fillRect(x-31,y,62,13);ctx.fillStyle="#d2c598";ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.fillText("LIVE HANDOFF",x,y+9);ctx.textAlign="left"}}
}
function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);const t=transform();ctx.save();ctx.translate(t.ox,t.oy);ctx.scale(t.s,t.s);room();furniture();particles();agents.forEach(drawAgent);interactions();ctx.restore()}
function tick(now){const dt=Math.min(40,now-state.last);state.last=now;if(state.running&&!state.approval){state.elapsed=Math.min(state.duration,state.elapsed+dt*state.speed);while(state.cursor<timeline.length&&state.elapsed>=timeline[state.cursor].at)timeline[state.cursor++].run();if(!state.approval){const progress=Math.min(96,Math.floor(state.elapsed/state.duration*100));$("#progressBar").style.width=progress+"%";$("#progressLabel").textContent=progress+"% · "+formatDuration(state.duration-state.elapsed)+" left"}state.spend=Math.min(4.07,.42+state.elapsed/1000*.0122);$("#spendMetric").textContent="$"+state.spend.toFixed(2)}ambient(now);move(dt);draw();requestAnimationFrame(tick)}
function canvasClick(e){const r=canvas.getBoundingClientRect(),t=transform(),x=(e.clientX-r.left-t.ox)/t.s,y=(e.clientY-r.top-t.oy)/t.s,a=agents.find(q=>Math.hypot(q.x-x,q.y-y)<30);if(a)return select(a.id);const z=zones.find(q=>x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h);if(z){const box=$("#selection"),crew=agents.filter(a=>a.zone===z.id).length;box.querySelector("span").textContent="STATION ZONE";box.querySelector("b").textContent=z.name;box.querySelector("p").textContent=crew+" crew assigned · "+z.type.toUpperCase()+" subsystem online.";box.style.borderColor=z.color;box.querySelector("span").style.color=z.color}}
function clock(){$("#clock").textContent=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Moscow",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date())}
$("#startBtn").onclick=start;$("#pauseBtn").onclick=pause;$("#resetBtn").onclick=()=>reset();$("#speed").onchange=e=>{state.speed=Number(e.target.value);event("system","Timeline speed changed","Simulation is running at "+state.speed+"×.","amber")};$("#approveBtn").onclick=()=>resolve(true);$("#rejectBtn").onclick=()=>resolve(false);$("#inspectBtn").onclick=()=>$("#inspectDialog").showModal();$("#clearFeed").onclick=()=>{$("#eventFeed").innerHTML="";state.count=0;$("#eventCount").textContent="00 EVENTS"};canvas.onclick=canvasClick;window.onresize=resize;if("ResizeObserver"in window)new ResizeObserver(resize).observe(canvas);
window.onkeydown=e=>{if(e.code==="Space"&&e.target.tagName!=="BUTTON"){e.preventDefault();state.running?pause():start()}if(e.key.toLowerCase()==="r")reset()};
renderRoster();resize();select("helm");stage(null,0,"Build the 2026 competitor intelligence brief","Research 24 sources, map claims, build an evidence pack, audit, and prepare release.");document.querySelectorAll("#stages span").forEach(n=>n.classList.remove("active","done"));
event("system","Station online","Room telemetry, pathing, and the five-minute mission clock are live.","green");event("vault","Evidence store mounted","Workspace is ready for source-linked artifacts.","cyan");event("airlock","Safety boundary armed","Publication requires one operator decision.","amber");
clock();setInterval(clock,1000);requestAnimationFrame(tick);
const autoplay=new URLSearchParams(location.search).get("autoplay");
if(autoplay==="handoff")setTimeout(()=>{state.elapsed=84000;agent("scout","delegating","handing off 24 sources","core");agent("forge","working","receiving source pack","core");const scout=agents.find(x=>x.id==="scout"),forge=agents.find(x=>x.id==="forge");Object.assign(scout,{x:510,y:300,tx:510,ty:300,path:[]});Object.assign(forge,{x:400,y:292,tx:400,ty:292,path:[]});event("scout","Live handoff","Scout and Forge are transferring the verified source pack.","amber");stage("synthesis",28,"Live evidence handoff","Two agents are exchanging 24 verified sources at the common table.")},250);
else if(autoplay==="approval")setTimeout(()=>{state.elapsed=290000;event("relay","Human decision requested","The audited brief is paused at the release boundary.","amber");agent("sentinel","complete","audit passed: 12/12","audit");agent("relay","waiting approval","awaiting final yes","airlock");agent("helm","waiting approval","decision packet ready","lounge");stage("release",97,"Final approval required","The complete intelligence brief is waiting for one human decision.");requestApproval()},250);
else if(autoplay){state.speed=50;$("#speed").value="10";setTimeout(start,250)}
})();
