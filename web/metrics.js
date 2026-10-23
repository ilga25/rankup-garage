(()=>{
 if(navigator.doNotTrack==='1')return;
 const endpoint=(window.rankupPublicBackend||(location.hostname==='rankup-garage.github.io'?'https://rankup-garage-rl-2210.violetvenus256.chatgpt.site':''))+'/api/metrics';
 const emit=data=>fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(data),credentials:'omit',keepalive:true}).catch(()=>{});
 const referrer=(()=>{try{return new URL(document.referrer).origin}catch{return 'direct'}})();
 emit({type:'pageview',path:location.pathname,referrer});
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;try{const u=new URL(a.href);if(u.protocol==='https:'&&u.origin!==location.origin)emit({type:'outbound',path:location.pathname,destination:u.origin})}catch{}});
})();
