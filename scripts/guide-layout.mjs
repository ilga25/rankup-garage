// Improve the guide library without changing article copy, URLs or publication dates.
export function polishGuides(assets,guides){
 const meta={
  'bronce-a-oro':{label:'EMPIEZA POR LA BASE',image:'practice-scene',summary:'Tiros, paradas y colocación. Una rutina de 20 minutos para empezar con intención.'},
  'oro-a-diamante':{label:'GANA CONSISTENCIA',image:'garage-scene',summary:'Potencia, recuperaciones y primeros aéreos. Elige un ejercicio y observa tus intentos.'},
  'mejorar-defensa':{label:'LEE LA JUGADA',image:'aerial-stadium',summary:'Colocación, paradas y despejes. Aprende a revisar una decisión antes del gol.'},
  'encontrar-duo-rocket-league':{label:'ENCUENTRA TU EQUIPO',image:'duo-scene',summary:'Modalidad, rango, servidor, idioma y horarios: prepara una búsqueda que encaje contigo.'}
 };
 const ordered=['bronce-a-oro','oro-a-diamante','mejorar-defensa','encontrar-duo-rocket-league'].map(slug=>guides.find(g=>g.slug===slug)).filter(Boolean);
 const cards=ordered.map(g=>`<a class="guide-tile" href="/guias/${g.slug}/"><img src="/assets/${meta[g.slug].image}.webp" width="560" height="260" loading="lazy" alt=""><div><span class="eyebrow">${meta[g.slug].label}</span><h3>${g.title}</h3><p>${meta[g.slug].summary}</p><span class="guide-read">Leer y practicar <b aria-hidden="true">↗</b></span></div></a>`).join('');
 const links=[['/','Inicio'],['/entrenamiento/','Entrenamiento'],['/mecanicas/','Mecánicas'],['/companeros/','Compañeros'],['/comunidad/','Comunidad'],['/progreso/','Progreso'],['/guias/','Guías'],['/cuenta/','Cuenta']];
 for(const [key,asset] of Object.entries(assets)){
  if(!key.startsWith('/guias')||!asset.type?.startsWith('text/html'))continue;
  let html=asset.body.replace('<body>','<body class="guides-shell">');
  html=html.replace(/<header>([\s\S]*?)<nav>[\s\S]*?<\/nav><\/header>/,`<header>$1<nav aria-label="Navegación principal">${links.map(([href,label])=>`<a href="${href}"${href==='/guias/'?' aria-current="page"':''}>${label}</a>`).join('')}</nav></header>`);
  if(key==='/guias'){
   const content=`<nav class="guide-breadcrumb" aria-label="Ruta"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Guías</span></nav><section class="guide-library-hero"><span class="eyebrow">APRENDE / PRACTICA / REPITE</span><h1>Guías para tu próxima sesión de Rocket League.</h1><p>Menos dudas sobre qué entrenar. Elige tu objetivo y pasa de leer un consejo a practicarlo.</p><a class="guide-library-jump" href="/guias/#elige-guia">Elegir mi guía ↓</a><span class="guide-language-note">Guías en español · La aplicación está disponible en ES, EN, FR y PT.</span></section><section class="guide-library" id="elige-guia" aria-labelledby="guide-library-title"><div class="guide-library-heading"><span class="eyebrow">ELIGE TU OBJETIVO</span><h2 id="guide-library-title">¿Qué quieres trabajar hoy?</h2></div><div class="guide-tile-grid">${cards}</div></section><section class="guide-next-step"><div><span class="eyebrow">DEL CONSEJO AL JUEGO</span><h2>Una sesión. Un objetivo. Una observación.</h2><p>Abre un pack o juego libre, cuenta tus intentos y anota qué probarás después. Los rangos son orientativos; adapta los ejercicios a tu nivel.</p></div><div class="guide-next-links"><a href="/entrenamiento/">Preparar mi entrenamiento ↗</a><a href="/mecanicas/">Explorar mecánicas ↗</a><a href="/progreso/">Abrir mi diario ↗</a></div></section>`;
   html=html.replace(/(<main[^>]*>)[\s\S]*?<\/main>/,'$1'+content+'</main>');
  }else{
   const headings=[];
   html=html.replace(/<article>([\s\S]*?)<\/article>/,(_,body)=>{
    body=body.replace(/<h2>([\s\S]*?)<\/h2>/g,(_,title)=>{const id='apartado-'+(headings.length+1);headings.push({id,title});return `<h2 id="${id}">${title}</h2>`});
    const toc=`<details class="guide-toc" open><summary>En esta guía</summary><nav aria-label="Índice de la guía">${headings.map(h=>`<a href="${key}/#${h.id}">${h.title}</a>`).join('')}</nav></details>`;
    return '<article>'+body.replace('</h1>','</h1>'+toc)+'</article>';
   });
   html=html.replace(/<section class="panel"><h2>Sigue aprendiendo<\/h2>[\s\S]*?<\/section>/,`<section class="guide-library"><h2>Sigue aprendiendo</h2><div class="guide-tile-grid">${cards.replace(new RegExp('<a class="guide-tile" href="'+key+'/">[\\s\\S]*?</a>'),'')}</div></section>`);
  }
  html=html.replace('</head>','<link rel="stylesheet" href="/guide-layout.css?v=guides-20261026"></head>');
  asset.body=html;
 }
}
