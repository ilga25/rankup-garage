import {normalizeAccount,json,read,body,objects,modes} from './api.mjs';
const teamRegions=new Set(['EU','NAE','NAW','SAM','OCE','ME','ASIA','SAF']);
const teamLanguages=new Set(['es','en','fr','pt','de','it','ar','other']);
const teamGoals=new Set(['ranked','practice','casual']);
export function validateTeamProfile(input){
 const account=normalizeAccount(input.platform,input.handle);
 if(!teamRegions.has(input.region)||!Array.isArray(input.languages)||input.languages.length<1||input.languages.length>4||input.languages.some(l=>!teamLanguages.has(l)))throw Error('invalid_team_profile');
 try{if(typeof input.timezone!=='string'||input.timezone.length>80)throw Error();new Intl.DateTimeFormat('en',{timeZone:input.timezone}).format()}catch{throw Error('invalid_team_profile')}
 return {...account,region:input.region,languages:[...new Set(input.languages)],timezone:input.timezone};
}
export function validateTeamPost(input){
 const profile=validateTeamProfile(input);
 if(!modes.has(input.mode)||!Number.isInteger(input.rank)||input.rank<0||input.rank>7||!teamGoals.has(input.goal)||typeof input.mic!=='boolean'||!Array.isArray(input.days)||input.days.length<1||input.days.length>7||input.days.some(d=>!Number.isInteger(d)||d<1||d>7)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.start||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.end||'')||input.start===input.end)throw Error('invalid_team_post');
 if(input.publish!==true)throw Error('consent_required');
 if(!['epic','psn','xbl','steam','discord'].includes(input.contactPlatform))throw Error('invalid_team_post');
 const contact=normalizeAccount(input.contactPlatform==='discord'?'other':input.contactPlatform,input.contactHandle);
 if(/[^\s@]+@[^\s@]+\.[^\s@]+/.test(contact.handle))throw Error('invalid_team_post');
 return {...profile,mode:input.mode,rank:input.rank,goal:input.goal,mic:input.mic,days:[...new Set(input.days)].sort(),start:input.start,end:input.end,contactPlatform:input.contactPlatform,contactHandle:contact.handle};
}
function normalizeTeam(item){if(Array.isArray(item.languages))return item;return {...item,languages:[item.language],timezone:'UTC',days:[],start:'',end:'',mic:false,contactPlatform:item.platform,contactHandle:item.handle,updatedAt:item.createdAt,legacyAvailability:item.availability}}
function publicTeam(item,isMine=false){const {contactPlatform,contactHandle,...safe}=item;return {...safe,isMine}}
export async function handleTeams(request,bucket,owner,url){
 const path=url.pathname;
 if(path==='/api/team-profile'){
  if(!owner)return json({error:'sign_in_required'},401);
  const key=`team-profiles-v1/${owner}.json`;
  if(request.method==='GET')return json({profile:await read(bucket,key)});
  if(request.method==='PUT'){const profile=validateTeamProfile(await body(request));await bucket.put(key,JSON.stringify(profile));return json({profile})}
 }
 if(path==='/api/teammates'&&request.method==='GET'){
  const filters=Object.fromEntries(url.searchParams);if((filters.region&&!teamRegions.has(filters.region))||(filters.mode&&!modes.has(filters.mode))||(filters.language&&!teamLanguages.has(filters.language))||(filters.rank!==undefined&&(!/^[0-7]$/.test(filters.rank))))return json({error:'invalid_filter'},400);
  let mine=null,rows=[];const now=Date.now();for(const e of await objects(bucket,'teammates-v1/')){const raw=await read(bucket,e.key),item=raw?normalizeTeam(raw):null;if(!item||Date.parse(item.expiresAt)<=now)continue;const isMine=!!owner&&e.key===`teammates-v1/${owner}.json`;if(isMine)mine={...item,isMine:true};if((!filters.region||item.region===filters.region)&&(!filters.mode||item.mode===filters.mode)&&(!filters.language||item.languages.includes(filters.language))&&(filters.rank===undefined||item.rank===+filters.rank))rows.push(publicTeam(item,isMine))}
  rows.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));return json({authenticated:!!owner,mine,items:rows.slice(0,100),total:rows.length});
 }
 if(path==='/api/teammates'&&request.method==='PUT'){
  if(!owner)return json({error:'sign_in_required'},401);const valid=validateTeamPost(await body(request)),key=`teammates-v1/${owner}.json`;
  for(let attempt=0;attempt<4;attempt++){const old=await bucket.get(key),previous=old?await old.json():null,now=Date.now();if(previous&&now-Date.parse(previous.updatedAt)<30000)return json({error:'team_rate_limit'},429);const item={...valid,id:previous?.id||crypto.randomUUID(),createdAt:previous?.createdAt||new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),expiresAt:new Date(now+7*86400000).toISOString()};const saved=await bucket.put(key,JSON.stringify(item),{onlyIf:old?{etagMatches:old.etag}:{etagDoesNotMatch:'*'}});if(saved){await bucket.put(`team-profiles-v1/${owner}.json`,JSON.stringify(validateTeamProfile(valid)));return json({item:{...item,isMine:true}},previous?200:201)}}return json({error:'retry_later'},409);
 }
 if(path==='/api/teammates'&&request.method==='DELETE'){if(!owner)return json({error:'sign_in_required'},401);if(!await read(bucket,`teammates-v1/${owner}.json`))return json({error:'not_found'},404);await bucket.delete(`teammates-v1/${owner}.json`);return json({deleted:true})}
 const contact=path.match(/^\/api\/teammates\/([a-f0-9-]{36})\/contact$/);
 if(contact&&request.method==='GET'){if(!owner)return json({error:'sign_in_required'},401);for(const e of await objects(bucket,'teammates-v1/')){const raw=await read(bucket,e.key),item=raw?normalizeTeam(raw):null;if(item?.id===contact[1]&&Date.parse(item.expiresAt)>Date.now())return json({platform:item.contactPlatform,handle:item.contactHandle})}return json({error:'not_found'},404)}
 return json({error:'not_found'},404);
}
