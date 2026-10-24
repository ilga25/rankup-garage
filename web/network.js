window.rankupFetch=async(path,options={})=>{
 await (window.rankupAuthReady||Promise.resolve());
 const backend=window.rankupPublicBackend||location.origin,user=window.rankupEmailAuth?.currentUser;
 if(user?.emailVerified){const token=await user.getIdToken();const headers=new Headers(options.headers);headers.set('Authorization','Bearer '+token);return fetch(backend+'/api/member/'+path.replace(/^\/api\//,''),{...options,headers,credentials:'omit'})}
 if(path==='/api/account')return new Response(JSON.stringify({authenticated:false,email:null,provider:'email'}),{headers:{'Content-Type':'application/json'}});
 if(options.method&&options.method!=='GET')return Promise.reject(Error('sign_in_required'));
 return fetch(backend+'/api/public/'+path.replace(/^\/api\//,''),{credentials:'omit'});
};
