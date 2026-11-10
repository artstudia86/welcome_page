(() => {
"use strict";
const params=new URLSearchParams(location.search), valid=v=>/^[a-p]{32}$/.test(v||"");
const candidate=params.get("id"), fallback=window.WELCOME_CONFIG?.storeExtensionId;
const id=valid(candidate)?candidate:valid(fallback)?fallback:null;
let manual=false,reachable=true,timer=null,pending=false;
function mode(v){if(v==="pin"||v==="usage")document.body.dataset.mode=v;}
function stop(){clearInterval(timer);timer=null;}
function hash(){const v=location.hash.slice(1);if(v==="pin"||v==="usage"){manual=true;stop();mode(v);return true;}return false;}
function check(){
 if(manual||!reachable||pending||document.visibilityState!=="visible")return;
 const runtime=window.chrome?.runtime;
 if(!id||typeof runtime?.sendMessage!=="function"){reachable=false;stop();return;}
 pending=true;let done=false;
 const timeout=setTimeout(()=>{if(!done){done=true;pending=false;reachable=false;stop();}},4000);
 try{runtime.sendMessage(id,{type:"getPinState"},reply=>{
 const error=runtime.lastError;if(done)return;done=true;clearTimeout(timeout);pending=false;
 if(error){reachable=false;stop();return;}
 if(!manual&&typeof reply?.isOnToolbar==="boolean")mode(reply.isOnToolbar?"usage":"pin");
 });}catch(_){done=true;clearTimeout(timeout);pending=false;reachable=false;stop();}
}
if(!hash()){mode(params.get("pinned")==="1"?"usage":"pin");timer=setInterval(check,1500);check();}
document.addEventListener("visibilitychange",check);window.addEventListener("focus",check);window.addEventListener("hashchange",hash);
document.addEventListener("click",e=>{const a=e.target.closest?.("[data-switch]");if(!a)return;e.preventDefault();manual=true;stop();mode(a.dataset.switch);history.replaceState(null,"","#"+a.dataset.switch);});
})();
