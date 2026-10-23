window.rankupFetch=(path,options={})=>{
 const backend=window.rankupPublicBackend;
 if(backend){if(options.method&&options.method!=='GET')return Promise.reject(Error('sign_in_required'));return fetch(backend+'/api/public/'+path.replace(/^\/api\//,''),{credentials:'omit'});}
 return fetch(path,{credentials:'same-origin',...options});
};
