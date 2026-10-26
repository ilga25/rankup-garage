export const sectionPages = [
 {slug:'entrenamiento',ids:['planner','results','training-library'],image:'practice-scene',title:'Entrena con un objetivo concreto',description:'Elige modalidad, rango y objetivo. Sigue una ruta de práctica y encuentra packs de entrenamiento de Rocket League adecuados a lo que necesitas trabajar.'},
 {slug:'mecanicas',ids:['mechanics'],image:'garage-scene',title:'Mecánicas: entiende, practica y repite',description:'Tutoriales y mapas para practicar wave dash, air dribble, flip reset y otras mecánicas. Empieza por los fundamentos y ajusta el reto a tu nivel.'},
 {slug:'companeros',ids:['teammates'],image:'duo-scene',title:'Encuentra compañeros con quienes encajes',description:'Busca dúo o equipo de Rocket League por país, servidor, idioma, modalidad y rango. Compara horarios y objetivos antes de agregar a alguien.'},
 {slug:'comunidad',ids:['shared-packs','community'],image:'practice-scene',title:'Comparte lo que te ayuda a practicar',description:'Descubre mapas compartidos por jugadores, aporta tus packs y celebra objetivos que hayas conseguido. Los logros son declaraciones de cada jugador.'},
 {slug:'progreso',ids:['community'],image:'garage-scene',private:true,title:'Tu práctica, sesión a sesión',description:'Guarda tus ejercicios, intentos y notas. Compara sesiones parecidas para elegir qué trabajar después. Tu diario es privado.'},
 {slug:'controles',ids:['results'],image:'garage-scene',title:'Controles que puedes hacer tuyos',description:'Consulta configuraciones para teclado y mando y guarda tus ajustes en este dispositivo. Practica con una configuración cómoda y consistente.'},
 {slug:'cuenta',ids:['account-section','player-profile'],image:'duo-scene',private:true,title:'Tu cuenta y tu perfil de jugador',description:'Entra con tu correo verificado. Edita tus rangos por modalidad y tus IDs de juego privados; publicar un anuncio de equipo es una decisión aparte.'},
 {slug:'patrocinadores',ids:['collaborations'],image:'aerial-stadium',title:'Ayuda a construir el próximo RankUp',description:'Propuestas de patrocinio mensual para marcas que quieran apoyar la comunidad. Comparte tu propuesta de forma privada, sin contratar ni pagar desde aquí.'}
];
export const sectionLinks={planner:'/entrenamiento/','training-library':'/entrenamiento/','plan':'/entrenamiento/',resources:'/entrenamiento/',mechanics:'/mecanicas/',teammates:'/companeros/','shared-packs':'/comunidad/',community:'/comunidad/','profile-section':'/comunidad/','monthly-section':'/comunidad/','progress-section':'/progreso/',controls:'/controles/','player-profile':'/cuenta/','account-section':'/cuenta/',collaborations:'/patrocinadores/'};
export function rewriteSectionLinks(html){return html.replace(/href="\/?#([a-z-]+)"/g,(all,id)=>sectionLinks[id]?`href="${sectionLinks[id]}"`:all).replace('class="brand" href="#"','class="brand" href="/"');}
function hide(html,id){return html.replace(new RegExp('<(section|div)([^>]*\\bid="'+id+'"[^>]*)>'),(all,tag,attrs)=>`<${tag}${attrs.replace(/\s+hidden\b/g,'')} hidden data-route-storage>`);}
const teamHelp=`<section class="match-explainer" aria-labelledby="match-explainer-title"><h2 id="match-explainer-title" data-page-copy="matchTitle">Un buen equipo empieza antes de la primera partida.</h2><div class="match-steps"><article><b>01 /</b><h3 data-page-copy="regionTitle">País y servidor son distintos</h3><p data-page-copy="regionText">Puedes indicar España como país y EU como servidor. El país es opcional; el servidor sirve para buscar una región de juego que os vaya bien a ambos.</p></article><article><b>02 /</b><h3 data-page-copy="scheduleTitle">Acordad cuándo y cómo jugar</h3><p data-page-copy="scheduleText">Compara idioma, micrófono, objetivo y horario con su zona horaria. El mismo rango no implica la misma disponibilidad.</p></article><article><b>03 /</b><h3 data-page-copy="privacyTitle">Prueba una sesión, con control</h3><p data-page-copy="privacyText">Los rangos son autodeclarados. El contacto de juego requiere iniciar sesión; nunca pedimos ubicación exacta. Tu anuncio caduca en siete días y puedes retirarlo.</p></article></div><a href="/guias/encontrar-duo-rocket-league/" data-page-copy="teamGuide">Cómo preparar una buena búsqueda de equipo →</a></section>`;
export function prepareSections(assets,origin){
 const original=assets['/index.html'].body;
 const roots=['planner','results','training-library','mechanics','shared-packs','player-profile','collaborations','account-section','teammates','community'];
 for(const page of sectionPages){
  let html=original.replace('<html lang="es">',`<html lang="es" data-page="${page.slug}">`).replace('<head>','<head><base href="/">');
  html=html.replace(/<section class="hero">[\s\S]*?<\/section>/,'');
  for(const id of roots)if(!page.ids.includes(id))html=hide(html,id);
  html=html.replace(/<section class="(hero|quick-start|panel seo-guides|closing)"/g,'<section hidden data-route-storage class="$1"');
  if(page.slug==='entrenamiento')html=hide(html,'controls');
  if(page.slug==='controles'){html=html.replace('<div id="results" hidden>','<div id="results">');html=hide(hide(html,'plan'),'resources');}
  if(page.slug==='comunidad')html=hide(html,'progress-section');
  if(page.slug==='progreso')html=hide(hide(html,'profile-section'),'monthly-section');
  const intro=`<section class="section-hero"><div><a class="section-home" href="/" data-page-copy="home">← Inicio</a><span class="eyebrow">RANKUP GARAGE / <span data-page-label="${page.slug}">${page.slug.toUpperCase()}</span></span><h1 data-page-title>${page.title}</h1><p data-page-description>${page.description}</p></div><img src="/assets/${page.image}.webp" width="480" height="360" alt="" fetchpriority="high"></section>`;
  html=html.replace('<main>',`<main class="section-page">${intro}`);
  if(page.slug==='companeros')html=html.replace('</main>',teamHelp+'</main>');
  html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${page.title} · RankUp Garage</title>`).replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*/g,'$1'+page.description).replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g,'$1'+page.title).replace(/(<link rel="canonical" href=")[^"]*/g,'$1'+origin+'/'+page.slug+'/').replace(/(<meta property="og:url" content=")[^"]*/g,'$1'+origin+'/'+page.slug+'/');
  html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
  const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{name:'Inicio',item:origin+'/'},{name:page.title,item:origin+'/'+page.slug+'/'}].map((x,i)=>({"@type":"ListItem",position:i+1,...x}))};
  html=html.replace('</head>',`${page.private?'<meta name="robots" content="noindex,follow">':''}<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script><link rel="stylesheet" href="/sections.css?v=sections-20261026"></head>`).replace('</body>','<script src="/site-pages.js?v=sections-20261026"></script></body>');
  assets['/'+page.slug]={type:'text/html; charset=utf-8',body:rewriteSectionLinks(html)};
 }
 let home=original;
 for(const id of roots)home=hide(home,id);
 home=home.replace('<html lang="es">','<html lang="es" data-page="inicio">').replace('</head>','<link rel="stylesheet" href="/sections.css?v=sections-20261026"></head>').replace('</body>','<script src="/site-pages.js?v=sections-20261026"></script></body>');
 const directory=`<section class="section-directory panel"><span class="eyebrow" data-page-copy="explore">ELIGE TU PRÓXIMO PASO</span><h2 data-page-copy="directoryTitle">Un espacio para cada parte de tu juego.</h2><div class="section-directory-grid">${sectionPages.map(p=>`<a href="/${p.slug}/"><span data-page-label="${p.slug}">${p.slug==='cuenta'?'Cuenta':p.slug==='companeros'?'Compañeros':p.slug[0].toUpperCase()+p.slug.slice(1)}</span><p data-page-summary="${p.slug}">${p.description}</p><b aria-hidden="true">↗</b></a>`).join('')}</div></section>`;
 home=home.replace('<section class="panel seo-guides">',directory+'<section class="panel seo-guides">');
 assets['/index.html'].body=rewriteSectionLinks(home);
 for(const [key,asset] of Object.entries(assets))if(key.startsWith('/guias')&&typeof asset.body==='string')asset.body=rewriteSectionLinks(asset.body);
 return sectionPages.filter(p=>!p.private).map(p=>'/'+p.slug+'/');
}
