import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {prepareSEO} from '../scripts/seo-assets.mjs';
import worker from '../dist/server/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const assets=prepareSEO({'/index.html':{body:fs.readFileSync(root+'web/index.html','utf8')}},root);
const primary='https://rankup-garage.github.io';

test('sitemap, canonicals and internal guide links agree on the primary host and slash',()=>{
 const urls=[...assets['/sitemap.xml'].body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,12);
 for(const url of urls){
  assert(url.startsWith(primary+'/'));assert(url.endsWith('/'));
  const path=new URL(url).pathname,key=path==='/'?'/index.html':path.slice(0,-1);
  const html=assets[key].body;
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert(html.includes(`rel="canonical" href="${url}"`));
  assert(!/<meta[^>]+(?:noindex|nofollow)/i.test(html));
  for(const m of html.matchAll(/href="(\/guias[^"#?]*)"/g)){
   assert(m[1].endsWith('/'));assert(assets[m[1].slice(0,-1)]);
  }
  for(const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(m[1]));
 }
 assert(assets['/robots.txt'].body.includes('Sitemap: '+primary+'/sitemap.xml'));
 assert(assets['/robots.txt'].body.includes('Disallow: /api/'));
 assert(!assets['/robots.txt'].body.includes('Disallow: /\n'));
});

test('guide URLs work on Sites with one permanent redirect and real missing pages stay 404',async()=>{
 for(const path of ['/guias','/guias/encontrar-duo-rocket-league','/companeros','/entrenamiento','/mecanicas','/cuenta']){
  const response=await worker.fetch(new Request('https://backend.example'+path+'?utm_source=test'),{});
  assert.equal(response.status,301);
  assert.equal(response.headers.get('location'),'https://backend.example'+path+'/?utm_source=test');
  const page=await worker.fetch(new Request(response.headers.get('location')),{});
  assert.equal(page.status,200);
  assert((await page.text()).includes(`rel="canonical" href="${primary+path}/"`));
 }
 assert.equal((await worker.fetch(new Request('https://backend.example/guias/missing/'),{})).status,404);
 assert.equal((await worker.fetch(new Request('https://backend.example/api/member/player-profile'),{})).status,401);
});

test('each section has its own address, focused content and safe private-page indexing',()=>{
 const sections={entrenamiento:['planner','training-library'],mecanicas:['mechanics'],companeros:['teammates'],comunidad:['shared-packs','community'],progreso:['community'],controles:['results'],cuenta:['account-section','player-profile'],patrocinadores:['collaborations']};
 for(const [slug,visible] of Object.entries(sections)){
  const html=assets['/'+slug].body;
  assert(html.includes(`data-page="${slug}"`));assert(html.includes('<base href="/">'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  for(const id of visible){const tag=html.match(new RegExp('<(?:section|div)[^>]*id="'+id+'"[^>]*>'))?.[0];assert(tag&&!tag.includes('data-route-storage'),slug+': '+id)}
  assert(!/href="\/?#(?:teammates|planner|mechanics|account-section)"/.test(html));
  assert.equal(html.includes('content="noindex,follow"'),['cuenta','progreso'].includes(slug));
  if(['cuenta','progreso'].includes(slug))assert(!assets['/sitemap.xml'].body.includes(primary+'/'+slug+'/'));
 }
 assert(assets['/companeros'].body.includes('País y servidor son distintos'));
 assert(!/href="\/?#(?:teammates|planner)"/.test(assets['/index.html'].body));
});
