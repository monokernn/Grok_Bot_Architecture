(() => {
"use strict";

const STORAGE_KEY="grokbot.architecture.token-prototype.v1";
const VERSION=1;
const DEMO_EMAIL="monokern@gmail.com";
const DEMO_DEPOSIT=2000000;
const PACKAGES=[{tokens:100000,credits:1000},{tokens:500000,credits:5000},{tokens:1000000,credits:10000}];
const $=selector=>document.querySelector(selector);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let depositInterval=null,toastTimer=null,settling=false,selectedPackage=PACKAGES[1];

function freshState(){
 return{
  version:VERSION,
  signedIn:false,
  profile:{name:"monokern",email:DEMO_EMAIL},
  wallet:{address:"",sol:0.025,architecture:0},
  credits:0,
  totals:{paid:0,compute:0,burned:0,bounty:0},
  deposit:{status:"idle",dueAt:null,credited:false},
  sessionId:null,
  lastReceipt:null
 };
}
function loadState(){
 try{
  const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY));
  if(!parsed||parsed.version!==VERSION)return freshState();
  return{...freshState(),...parsed,wallet:{...freshState().wallet,...parsed.wallet},totals:{...freshState().totals,...parsed.totals},deposit:{...freshState().deposit,...parsed.deposit}};
 }catch(error){return freshState()}
}
let state=loadState();
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){}}
function snapshot(){return JSON.parse(JSON.stringify(state))}
function formatToken(value){return new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Math.max(0,Number(value)||0))}
function formatSol(value){return Number(value||0).toFixed(4)}
function shortAddress(value){return value?value.slice(0,7)+"..."+value.slice(-7):"GENERATING..."}
function demoSession(){return"gmail_"+Date.now().toString(36).slice(-7).toUpperCase()}
function emit(type,title,message,tone="cyan",extra={}){
 window.dispatchEvent(new CustomEvent("tokenprototype",{detail:{type,title,message,tone,...extra}}));
}
function showToast(title,message,tone="cyan"){
 const toast=$("#tokenToast");clearTimeout(toastTimer);toast.hidden=true;toast.className="token-toast "+tone;
 $("#tokenToastTitle").textContent=title;$("#tokenToastMessage").textContent=message;void toast.offsetWidth;toast.hidden=false;
 toastTimer=setTimeout(()=>toast.hidden=true,3900);
}
function base58(bytes){
 const alphabet="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",digits=[0];
 for(const byte of bytes){
  let carry=byte;
  for(let i=0;i<digits.length;i++){carry+=digits[i]<<8;digits[i]=carry%58;carry=Math.floor(carry/58)}
  while(carry){digits.push(carry%58);carry=Math.floor(carry/58)}
 }
 for(let i=0;i<bytes.length-1&&bytes[i]===0;i++)digits.push(0);
 return digits.reverse().map(digit=>alphabet[digit]).join("");
}
async function demoAddress(email){
 let bytes;
 if(globalThis.crypto&&crypto.subtle)bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("grok-bot-architecture-demo:"+email.toLowerCase())));
 else{
  bytes=new Uint8Array(32);let hash=2166136261;
  for(const char of email){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}
  for(let i=0;i<bytes.length;i++){hash=Math.imul(hash^i,2246822519);bytes[i]=(hash>>>((i%4)*8))&255}
 }
 return base58(bytes);
}
function render(){
 $("#gmailSignIn").hidden=state.signedIn;$("#profileChip").hidden=!state.signedIn;
 if(!state.signedIn){$("#walletPanel").hidden=true;return}
 $("#walletHeaderBalance").textContent=formatToken(state.wallet.architecture)+" $ARCH";
 $("#solBalance").textContent=formatSol(state.wallet.sol);$("#architectureBalance").textContent=formatToken(state.wallet.architecture);
 $("#walletAddress").textContent=state.wallet.address||"GENERATING...";
 $("#agentCreditBalance").textContent=formatToken(state.credits)+" CREDITS";
 $("#headerCreditBalance").textContent=formatToken(state.credits);
 $("#walletSession").textContent=(state.sessionId||"SESSION PENDING")+" / LOCAL PROTOTYPE";
 $("#checkoutWalletBalance").textContent=formatToken(state.wallet.architecture)+" $ARCH";
 renderPackage();
 renderDeposit();
}
function renderDeposit(){
 const watch=$("#depositWatch");
 if(state.deposit.status!=="watching"){watch.hidden=true;return}
 watch.hidden=false;const remaining=Math.max(0,Math.ceil((state.deposit.dueAt-Date.now())/1000));
 $("#depositCountdown").textContent=remaining?"DEPOSIT IN "+remaining+"S":"CONFIRMING";
}
function allocation(){
 const tokens=selectedPackage.tokens;
 return{tokens,credits:selectedPackage.credits,compute:Math.floor(tokens*.85),burn:Math.floor(tokens*.10),bounty:tokens-Math.floor(tokens*.85)-Math.floor(tokens*.10)};
}
function renderPackage(){
 const split=allocation(),enough=state.wallet.architecture>=split.tokens;
 document.querySelectorAll("#creditPackages button").forEach(button=>button.classList.toggle("selected",Number(button.dataset.tokenAmount)===split.tokens));
 $("#computeAllocation").textContent=formatToken(split.compute)+" $ARCH";$("#burnAllocation").textContent=formatToken(split.burn)+" $ARCH";$("#bountyAllocation").textContent=formatToken(split.bounty)+" $ARCH";
 $("#balanceAfterPurchase").textContent=formatToken(Math.max(0,state.wallet.architecture-split.tokens))+" $ARCH";
 $("#confirmCreditPurchase").textContent=enough?"PAY "+formatToken(split.tokens)+" $ARCH":"INSUFFICIENT $ARCH";
 $("#confirmCreditPurchase").disabled=!enough||settling;
}
async function signIn(){
 const button=$("#gmailSignIn");button.disabled=true;button.classList.add("loading");button.querySelector("small").textContent="AUTHENTICATING";
 await wait(750);
 if(!state.wallet.address)state.wallet.address=await demoAddress(DEMO_EMAIL);
 state.signedIn=true;state.sessionId=state.sessionId||demoSession();save();render();
 button.disabled=false;button.classList.remove("loading");button.querySelector("small").textContent="CONTINUE WITH";
 showToast("GMAIL PROFILE READY","A separate prototype wallet was generated for monokern.","green");
 emit("signin","Gmail profile authenticated","monokern profile and custodial prototype wallet initialized.","green");
}
function toggleWallet(force){
 if(!state.signedIn)return;const panel=$("#walletPanel"),open=typeof force==="boolean"?force:panel.hidden;
 panel.hidden=!open;if(open)render();
}
async function copyText(value){
 try{await navigator.clipboard.writeText(value);return true}catch(error){}
 const area=document.createElement("textarea");area.value=value;area.style.position="fixed";area.style.opacity="0";document.body.append(area);area.select();
 const copied=document.execCommand("copy");area.remove();return copied;
}
async function copyAddress(){
 await copyText(state.wallet.address);
 showToast("ADDRESS COPIED",shortAddress(state.wallet.address)+" / deposit watcher armed.","cyan");
 emit("wallet","Deposit address copied","Prototype watcher is waiting for an incoming $ARCHITECTURE transfer.","cyan");
 if(!state.deposit.credited&&state.deposit.status!=="watching"){
  state.deposit={status:"watching",dueAt:Date.now()+5000,credited:false};save();scheduleDeposit();
 }
}
function scheduleDeposit(){
 clearInterval(depositInterval);
 if(state.deposit.status!=="watching")return;
 const complete=()=>{
  state.wallet.architecture=DEMO_DEPOSIT;state.deposit={status:"confirmed",dueAt:null,credited:true};save();render();
  showToast("DEPOSIT CONFIRMED",formatToken(DEMO_DEPOSIT)+" $ARCHITECTURE credited to monokern.wallet.","green");
  emit("wallet","Token deposit confirmed",formatToken(DEMO_DEPOSIT)+" $ARCHITECTURE credited after the prototype settlement delay.","green",{amount:DEMO_DEPOSIT});
 };
 const update=()=>{if(Date.now()>=state.deposit.dueAt){clearInterval(depositInterval);complete()}else renderDeposit()};
 update();if(state.deposit.status==="watching")depositInterval=setInterval(update,250);
}
function openCheckout(){
 if(!state.signedIn)return;
 settling=false;$("#settlementProgress").hidden=true;$("#settlementReceipt").hidden=true;$("#confirmCreditPurchase").hidden=false;
 document.querySelectorAll("[data-settlement-step]").forEach(step=>step.className="");
 $("#creditBackdrop").hidden=false;$("#creditCheckout").hidden=false;renderPackage();
}
function closeCheckout(){
 if(settling)return;$("#creditBackdrop").hidden=true;$("#creditCheckout").hidden=true;
}
async function settlePurchase(){
 const split=allocation();if(settling||state.wallet.architecture<split.tokens)return;
 settling=true;renderPackage();$("#confirmCreditPurchase").textContent="SETTLING PAYMENT";$("#settlementProgress").hidden=false;$("#settlementReceipt").hidden=true;
 const steps=["authorize","compute","burn","bounty","credits"];
 for(const step of steps){
  const node=document.querySelector('[data-settlement-step="'+step+'"]');node.classList.add("active");await wait(480);node.classList.remove("active");node.classList.add("done");
 }
 state.wallet.architecture-=split.tokens;state.credits+=split.credits;state.totals.paid+=split.tokens;state.totals.compute+=split.compute;state.totals.burned+=split.burn;state.totals.bounty+=split.bounty;
 state.lastReceipt={id:""+Date.now().toString(36).toUpperCase(),...split,createdAt:new Date().toISOString()};save();settling=false;render();
 $("#settlementReceiptTitle").textContent=formatToken(split.credits)+" AGENT CREDITS ISSUED";
 $("#settlementReceiptId").textContent=state.lastReceipt.id+" / "+formatToken(split.burn)+" $ARCH BURN ALLOCATED";
 $("#settlementReceipt").hidden=false;$("#confirmCreditPurchase").hidden=true;
 showToast("CREDITS PURCHASED",formatToken(split.credits)+" credits issued / "+formatToken(split.burn)+" $ARCH burn allocated.","green");
 emit("payment","Agent credits settled",formatToken(split.tokens)+" $ARCH distributed: 85% compute, 10% burn, 5% bounty.","green",split);
}
function authorizeCredits(amount,meta={}){
 const cost=Math.max(0,Math.floor(Number(amount)||0)),label=meta.label||meta.missionId||"Agent mission";
 if(!state.signedIn){showToast("GMAIL SIGN-IN REQUIRED","Sign in before starting an agent mission.","amber");emit("usage","Mission start blocked","Gmail profile and Agent Credits are required.","amber");return{ok:false,reason:"signin",balance:state.credits,cost}}
 if(state.credits<cost){showToast("MORE CREDITS REQUIRED",formatToken(cost)+" estimated credits / "+formatToken(state.credits)+" available.","amber");openCheckout();emit("usage","Insufficient Agent Credits",label+" is estimated to use "+formatToken(cost)+" credits.","amber",{cost,balance:state.credits});return{ok:false,reason:"credits",balance:state.credits,cost}}
 showToast("USAGE METER READY",formatToken(cost)+" estimated credits. Billing starts only while agents work.","green");
 emit("usage","Live credit meter ready",label+" / estimated "+formatToken(cost)+" credits / zero charged at start.","green",{cost,balance:state.credits});
 return{ok:true,balance:state.credits,cost};
}
function consumeCredits(amount,meta={}){
 const cost=Math.max(0,Math.floor(Number(amount)||0)),label=meta.label||meta.missionId||"Agent mission";
 if(!state.signedIn){showToast("GMAIL SIGN-IN REQUIRED","Sign in before starting an agent mission.","amber");emit("usage","Mission start blocked","Gmail profile and Agent Credits are required.","amber");return{ok:false,reason:"signin",balance:state.credits,cost}}
 if(!cost)return{ok:true,balance:state.credits,cost:0};
 if(state.credits<cost){showToast("MORE CREDITS REQUIRED",formatToken(cost)+" credits required / "+formatToken(state.credits)+" available.","amber");openCheckout();emit("usage","Insufficient Agent Credits",label+" requires "+formatToken(cost)+" credits.","amber",{cost,balance:state.credits});return{ok:false,reason:"credits",balance:state.credits,cost}}
 state.credits-=cost;save();render();
 if(!meta.silent){showToast("CREDITS USED",formatToken(cost)+" credits charged for "+label+".","green");emit("usage","Agent Credits used",formatToken(cost)+" credits charged / "+formatToken(state.credits)+" remaining.","green",{cost,balance:state.credits})}
 return{ok:true,balance:state.credits,cost};
}
function toggleWithdraw(){
 $("#withdrawForm").hidden=!$("#withdrawForm").hidden;$("#withdrawMessage").textContent="Prototype only. No transaction will be submitted.";
}
function previewWithdraw(event){
 event.preventDefault();const asset=$("#withdrawAsset").value,amount=Number($("#withdrawAmount").value),address=$("#withdrawAddress").value.trim(),available=asset==="sol"?state.wallet.sol:state.wallet.architecture;
 if(!address||address.length<20){$("#withdrawMessage").textContent="Enter a valid destination address.";return}
 if(!amount||amount<=0||amount>available){$("#withdrawMessage").textContent="Amount exceeds the available demo balance.";return}
 $("#withdrawMessage").textContent="Preview ready: "+(asset==="sol"?formatSol(amount):formatToken(amount))+" "+(asset==="sol"?"SOL":"$ARCH")+" / production requires 2FA and signed approval.";
 emit("wallet","Withdrawal preview created","No funds moved; production authorization would be required.","amber");
}
function resetDemo(){
 if(!confirm("Reset the Gmail wallet and token payment prototype?"))return;
 clearInterval(depositInterval);state=freshState();selectedPackage=PACKAGES[1];save();$("#walletPanel").hidden=true;$("#withdrawForm").hidden=true;closeCheckout();render();
 showToast("PROTOTYPE RESET","Gmail profile, wallet balances, and credits were cleared.","amber");
 emit("wallet","Payment prototype reset","Local state was cleared.","amber");
}
function bind(){
 $("#gmailSignIn").onclick=signIn;$("#walletToggle").onclick=()=>toggleWallet();$("#creditsToggle").onclick=openCheckout;$("#closeWallet").onclick=()=>toggleWallet(false);
 $("#copyWalletAddress").onclick=copyAddress;$("#withdrawToggle").onclick=toggleWithdraw;$("#withdrawForm").onsubmit=previewWithdraw;
 $("#buyCredits").onclick=openCheckout;$("#closeCreditCheckout").onclick=closeCheckout;$("#creditBackdrop").onclick=closeCheckout;$("#confirmCreditPurchase").onclick=settlePurchase;$("#resetWalletDemo").onclick=resetDemo;
 document.querySelectorAll("#creditPackages button").forEach(button=>button.onclick=()=>{if(settling)return;selectedPackage={tokens:Number(button.dataset.tokenAmount),credits:Number(button.dataset.creditAmount)};renderPackage()});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"){toggleWallet(false);closeCheckout()}});
 render();if(state.deposit.status==="watching")scheduleDeposit();
}
window.tokenPaymentsPrototype={snapshot,openWallet:()=>toggleWallet(true),openCheckout,authorizeCredits,consumeCredits,reset:()=>{state=freshState();save();render()}};
bind();
})();
