import {handleApi} from './api.mjs';
import {firebaseConfig} from './firebase-config.mjs';

const memberOrigins=new Set(['https://rankup-garage.github.io','https://rankup-garage-rl-2210.violetvenus256.chatgpt.site']);
function authFailure(code,status=401){return Object.assign(new Error(code),{status})}
function memberJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
// Firebase verifies the token signature and current account status. Never trust browser claims alone.
export async function verifyEmailIdentity(token,config=firebaseConfig,lookup=fetch){
 if(typeof token!=='string'||token.length>8192)throw authFailure('invalid_session');
 let claims,header;try{const parts=token.split('.');if(parts.length!==3)throw Error();const decode=s=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));header=decode(parts[0]);claims=decode(parts[1])}catch{throw authFailure('invalid_session')}
 const now=Math.floor(Date.now()/1000);
 if(header.alg!=='RS256'||!header.kid||claims.aud!==config.projectId||claims.iss!==`https://securetoken.google.com/${config.projectId}`||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>128||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+30||!Number.isFinite(claims.auth_time)||claims.auth_time>now+30)throw authFailure('invalid_session');
 let response;try{response=await lookup('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(10000)})}catch{throw authFailure('auth_service_unavailable',503)}
 if(!response.ok)throw authFailure(response.status>=500?'auth_service_unavailable':'invalid_session',response.status>=500?503:401);
 const user=(await response.json()).users?.[0];
 if(!user||user.localId!==claims.sub||user.disabled||!user.email||Number(user.validSince||0)>claims.auth_time)throw authFailure('invalid_session');
 if(user.emailVerified!==true)throw authFailure('verify_email_first',403);
 return {id:'firebase:'+config.projectId+':'+user.localId,email:user.email.toLowerCase(),provider:'email',verified:true};
}
export async function handleMemberApi(request,env){
 const origin=request.headers.get('Origin'),url=new URL(request.url),ownOrigin=url.origin;
 if(origin&&!memberOrigins.has(origin)&&origin!==ownOrigin)return memberJson({error:'origin_not_allowed'},403);
 const cors={'Access-Control-Allow-Origin':origin||ownOrigin,'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'600','Vary':'Origin','Cache-Control':'no-store'};
 const wrap=r=>{const headers=new Headers(r.headers);for(const[k,v]of Object.entries(cors))headers.set(k,v);return new Response(r.body,{status:r.status,headers})};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 const allowed=/^\/api\/member\/(account|profile|player-profile|progress(?:\/[a-f0-9-]+)?|achievements(?:\/[a-f0-9-]+)?|team-profile|teammates(?:\/[a-f0-9-]+(?:\/contact)?)?|shared-packs(?:\/[a-f0-9-]+)?|collaborations|insights)$/;
 if(!allowed.test(url.pathname))return wrap(memberJson({error:'not_found'},404));
 const bearer=request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!bearer)return wrap(url.pathname==='/api/member/account'?memberJson({authenticated:false,email:null,provider:'email'}):memberJson({error:'sign_in_required'},401));
 try{const identity=await verifyEmailIdentity(bearer);url.pathname=url.pathname.replace('/api/member/','/api/');return wrap(await handleApi(new Request(url,request),env,identity))}catch(error){return wrap(memberJson({error:error.status?error.message:'auth_service_unavailable'},error.status||503))}
}
