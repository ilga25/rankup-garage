import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {prepareSEO} from './seo-assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'docs'),backend='https://rankup-garage-rl-2210.violetvenus256.chatgpt.site',prefix=process.env.RANKUP_PAGES_PREFIX??'/rankup-garage',origin=process.env.RANKUP_PAGES_ORIGIN??'https://ilga25.github.io';
// This directory is generated from web/ and SEO sources; it contains no account data.
fs.mkdirSync(out,{recursive:true});const assets={};
function collect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())collect(file);else{const key='/'+path.relative(path.join(root,'web'),file).split(path.sep).join('/');assets[key]={body:fs.readFileSync(file),binary:!(/\.(html|js|css|json|svg)$/.test(file))};if(!assets[key].binary)assets[key].body=assets[key].body.toString('utf8')}}}collect(path.join(root,'web'));prepareSEO(assets,root);
for(const [key,asset] of Object.entries(assets)){
 let body=asset.body;
 if(!asset.binary&&typeof body==='string'){
  body=body.replaceAll(backend,origin+prefix);
  if(origin==='https://rankup-garage.github.io')body=body.replace(/https:\/\/rankup-garage\.github\.io\/guias\/([a-z0-9-]+)(?=["<])/g,'https://rankup-garage.github.io/guias/$1/');
  if(origin==='https://rankup-garage.github.io' && (key.endsWith('.html')||key.startsWith('/guias/')))body=body.replace('</head>','<meta name="google-site-verification" content="uMz_1IfkeIMP0ePwcQ0-DNI5jEQS2VA-yHN2YY6JvP4"></head>');
  if(key.endsWith('.js'))body=body.replaceAll('href="/signin-with-chatgpt','href="'+backend+'/signin-with-chatgpt');
  if(key==='/index.html')body=body.replace('<head>','<head><base href="'+prefix+'/">').replace('<script src="network.js','<script>window.rankupPublicBackend='+JSON.stringify(backend)+';</script><script src="network.js');
  if(key.startsWith('/guias/'))body=body.replace('<head>','<head><base href="'+prefix+'/">');
  if(key.endsWith('.html')||key.startsWith('/guias/'))body=body.replace(/href="\/(?!\/|rankup-garage\/)/g,'href="'+prefix+'/');
  // A project Pages site cannot control /robots.txt on the account's root domain.
 }
 const target=path.join(out,key.startsWith('/guias/')?key.slice(1)+'/index.html':key.slice(1));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);
}
fs.writeFileSync(path.join(out,'.nojekyll'),'');console.log('Built GitHub Pages in docs/');
