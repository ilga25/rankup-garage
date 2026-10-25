import {json,read,body,objects,modes} from './api.mjs';
const madridDay=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const packSkills=new Set(['shooting','defense','aerial','wall','control']);
const safeText=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.trim().length<=max&&!/[\x00-\x1f\x7f<>]/.test(value);
const emailLike=value=>/[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
export function validatePlayer(input){
 if(!modes.has(input.mode)||!['es','en','fr','pt'].includes(input.language)||!input.ranks||Object.keys(input.ranks).length!==3||[...modes].some(m=>!Number.isInteger(input.ranks[m])||input.ranks[m]<0||input.ranks[m]>7))throw Error('invalid_player');
 const ids={};for(const platform of ['epic','psn','xbl','steam','discord']){const value=String(input.ids?.[platform]||'').trim();if(value&&(!safeText(value,2,70)||emailLike(value)||/https?:|www\./i.test(value)))throw Error('invalid_player');ids[platform]=value}
 return {mode:input.mode,language:input.language,ranks:Object.fromEntries([...modes].map(m=>[m,input.ranks[m]])),ids};
}
export function validateSharedPack(input){
 if(input.publish!==true)throw Error('consent_required');
 if(!safeText(input.title,3,80)||!safeText(input.author,2,40)||!safeText(input.note,10,300)||[input.title,input.author,input.note].some(emailLike)||!/^[A-F0-9]{4}(-[A-F0-9]{4}){3}$/.test(input.code||'')||!packSkills.has(input.skill)||!Number.isInteger(input.minRank)||!Number.isInteger(input.maxRank)||input.minRank<0||input.maxRank>7||input.minRank>input.maxRank)throw Error('invalid_pack');
 return {title:input.title.trim(),author:input.author.trim(),note:input.note.trim(),code:input.code,skill:input.skill,minRank:input.minRank,maxRank:input.maxRank,source:'player_submission'};
}
export function validateSponsor(input){if(input.consent!==true)throw Error('consent_required');if(!safeText(input.company,2,80)||!safeText(input.proposal,20,1000)||!['sponsor','featured','other'].includes(input.type))throw Error('invalid_sponsor');let website='';if(input.website){try{const url=new URL(input.website);if(url.protocol!=='https:'||url.username||url.password)throw Error();website=url.origin+url.pathname}catch{throw Error('invalid_sponsor')}}return {company:input.company.trim(),proposal:input.proposal.trim(),type:input.type,website,status:'pending_review'}}
const cleanPack=(item,isMine)=>{const {owner,...safe}=item;return {...safe,isMine}};
export async function handleFeatures(request,env,owner,url,identity=null){
 const path=url.pathname,bucket=env.BUCKET;
 if(path==='/api/player-profile'){
  if(!owner)return json({error:'sign_in_required'},401);const key=`player-profiles-v1/${owner}.json`;
  if(request.method==='GET')return json({profile:await read(bucket,key)});
  if(request.method==='PUT'){const profile={...validatePlayer(await body(request)),updatedAt:new Date().toISOString()};await bucket.put(key,JSON.stringify(profile));return json({profile})}
 }
 if(path==='/api/shared-packs'&&request.method==='GET'){
  const rank=url.searchParams.get('rank'),skill=url.searchParams.get('skill');if((rank!==null&&!/^[0-7]$/.test(rank))||(skill&&!packSkills.has(skill)))return json({error:'invalid_filter'},400);
  let items=[];for(const entry of await objects(bucket,'shared-packs-v1/')){const data=await read(bucket,entry.key);items.push(...(data?.items||[]).filter(p=>(rank===null||p.minRank<=+rank&&+rank<=p.maxRank)&&(!skill||p.skill===skill)).map(p=>cleanPack(p,!!owner&&entry.key===`shared-packs-v1/${owner}.json`)))}items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));return json({items:items.slice(0,100),total:items.length});
 }
 if(path==='/api/shared-packs'&&request.method==='POST'){
  if(!owner)return json({error:'sign_in_required'},401);const valid=validateSharedPack(await body(request)),key=`shared-packs-v1/${owner}.json`;
  for(let i=0;i<4;i++){const old=await bucket.get(key),data=old?await old.json():{items:[]};if(data.items.length>=5)return json({error:'pack_limit'},429);if(data.items.some(p=>p.code===valid.code))return json({error:'duplicate_pack'},409);if(data.items.some(p=>Date.now()-Date.parse(p.createdAt)<60000))return json({error:'wait_one_minute'},429);const item={...valid,id:crypto.randomUUID(),createdAt:new Date().toISOString()};if(await bucket.put(key,JSON.stringify({items:[...data.items,item]}),{onlyIf:old?{etagMatches:old.etag}:{etagDoesNotMatch:'*'}}))return json({item:cleanPack(item,true)},201)}return json({error:'retry_later'},409);
 }
 const deletion=path.match(/^\/api\/shared-packs\/([a-f0-9-]{36})$/);
 if(deletion&&request.method==='DELETE'){if(!owner)return json({error:'sign_in_required'},401);const key=`shared-packs-v1/${owner}.json`;for(let i=0;i<4;i++){const old=await bucket.get(key);if(!old)return json({error:'not_found'},404);const data=await old.json(),items=data.items.filter(p=>p.id!==deletion[1]);if(items.length===data.items.length)return json({error:'not_found'},404);if(await bucket.put(key,JSON.stringify({items}),{onlyIf:{etagMatches:old.etag}}))return json({deleted:true})}return json({error:'retry_later'},409)}
 if(path==='/api/collaborations'){
  if(!owner)return json({error:'sign_in_required'},401);const key=`collaborations-v1/${owner}.json`;
  if(request.method==='GET'){const item=await read(bucket,key);return json({proposal:item?{company:item.company,status:item.status,createdAt:item.createdAt}:null})}
  if(request.method==='POST'){const valid=validateSponsor(await body(request)),old=await read(bucket,key);if(old&&Date.now()-Date.parse(old.createdAt)<86400000)return json({error:'daily_limit'},429);const item={...valid,accountEmail:identity?.email||request.headers.get('oai-authenticated-user-email')||null,createdAt:new Date().toISOString()};await bucket.put(key,JSON.stringify(item));return json({proposal:{company:item.company,status:item.status,createdAt:item.createdAt}},201)}
 }
 if(path==='/api/insights'){
  if(!owner)return json({error:'sign_in_required'},401);if(!env.OWNER_EMAIL||(identity?.email||request.headers.get('oai-authenticated-user-email'))?.toLowerCase()!==env.OWNER_EMAIL.toLowerCase())return json({error:'forbidden'},403);
  const rows=[];for(let i=0;i<14;i++){const day=madridDay(new Date(Date.now()-i*86400000)),record=await read(bucket,`analytics-v1/${day}.json`);rows.push({day,available:day>='2026-10-24',...record||{pageviews:0,outbound:0,pages:{},referrers:{},destinations:{}}})}const proposals=[];for(const entry of (await objects(bucket,'collaborations-v1/')).slice(0,50)){const item=await read(bucket,entry.key);if(item)proposals.push(item)}return json({startedAt:'2026-10-24',timezone:'Europe/Madrid',days:rows,proposals,note:'Client events, not unique visitors. Missing historical data is unavailable, not zero.'});
 }
 return json({error:'not_found'},404);
}
export async function handleMetrics(request,env){
 const origin=request.headers.get('Origin'),allowed=new Set(['https://rankup-garage.github.io',new URL(request.url).origin]);if(!allowed.has(origin))return json({error:'origin_not_allowed'},403);
 const headers={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};if(request.method==='OPTIONS')return new Response(null,{status:204,headers});if(request.method!=='POST'||!env.BUCKET)return new Response(null,{status:405,headers});
 try{const input=await body(request);if(!['pageview','outbound'].includes(input.type))throw Error();const routes=new Set(['/','/guias/bronce-a-oro/','/guias/oro-a-diamante/','/guias/mejorar-defensa/','/guias/encontrar-duo-rocket-league/']);const page=routes.has(input.path)?input.path:'/';const hostname=value=>{if(value==='direct')return 'direct';try{const h=new URL(value).hostname;return h.length<120?h:'other'}catch{return 'other'}};const ref=hostname(input.referrer||'direct'),destination=input.type==='outbound'?hostname(input.destination):null,key=`analytics-v1/${madridDay()}.json`;
  for(let i=0;i<4;i++){const old=await env.BUCKET.get(key),data=old?await old.json():{pageviews:0,outbound:0,pages:{},referrers:{},destinations:{}};const increment=(obj,k)=>{if(Object.keys(obj).length>=30&&obj[k]===undefined)k='other';obj[k]=(obj[k]||0)+1};if(input.type==='pageview'){data.pageviews++;increment(data.pages,page);increment(data.referrers,ref)}else{data.outbound++;increment(data.destinations,destination)}if(await env.BUCKET.put(key,JSON.stringify(data),{onlyIf:old?{etagMatches:old.etag}:{etagDoesNotMatch:'*'}}))return new Response(null,{status:204,headers})}return new Response(null,{status:503,headers});
 }catch{return new Response(null,{status:400,headers})}
}
