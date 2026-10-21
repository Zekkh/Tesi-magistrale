'use strict';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const fmt = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });

// Scroll progress and entrance transitions.
const progressBar = $('#scroll-progress-bar');
let scrollTicking = false;
function updateScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progressBar.style.width = `${Math.min(100, Math.max(0, (scrollY / max) * 100))}%`;
  scrollTicking = false;
}
addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScroll);
    scrollTicking = true;
  }
}, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();

const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !motionReduced) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.07, rootMargin: '0px 0px -25px 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('in-view'));
}

// Mobile menu.
const menuButton = $('#menu-toggle');
const nav = $('#main-nav');
function closeMenu() {
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Apri il menu');
}
menuButton.addEventListener('click', () => {
  const opened = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.setAttribute('aria-label', opened ? 'Chiudi il menu' : 'Apri il menu');
});
$$('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

// Molecular explorer: faithful, concise descriptions from the thesis.
const geneData = {
  ldlr: {
    code: 'LDLR', tag: 'GENE CANONICO', title: 'Il recettore delle LDL.',
    body: 'LDLR codifica il recettore che permette alle cellule di captare le particelle LDL dal circolo. Alterazioni della sua funzione possono ridurre la clearance del colesterolo LDL.',
    facts: ['ENDOCITOSI', 'CLEARANCE LDL'], page: 6
  },
  apob: {
    code: 'APOB', tag: 'GENE CANONICO', title: 'La particella che deve essere riconosciuta.',
    body: 'APOB codifica l’apolipoproteina B100, principale componente delle LDL e ligando del recettore LDLR. Alcune varianti alterano il riconoscimento e la captazione epatica delle particelle LDL.',
    facts: ['APOLIPOPROTEINA B100', 'LEGAME CON LDLR'], page: 9
  },
  pcsk9: {
    code: 'PCSK9', tag: 'GENE CANONICO', title: 'Il destino del recettore.',
    body: 'PCSK9 regola la degradazione lisosomiale di LDLR. Varianti con guadagno di funzione possono favorire la degradazione del recettore, riducendone la disponibilità sulla superficie cellulare.',
    facts: ['RICICLO LDLR', 'DEGRADAZIONE LISOSOMIALE'], page: 10
  },
  oltre: {
    code: 'BEYOND', tag: 'PISTE ESPLORATIVE', title: 'E se la risposta fosse altrove?',
    body: 'Il lavoro esplora geni e processi oltre quelli canonici, tra cui vie endo-lisosomiali, traffico intracellulare, metabolismo lipidico e condizioni capaci di imitare il fenotipo FH. Sono ipotesi da validare, non nuove diagnosi.',
    facts: ['NPC1 · GLB1 · HEXB', 'TRASPORTO LIPIDICO', 'FENOCOPIE FH'], page: 65
  }
};
$$('.gene-tab').forEach(button => button.addEventListener('click', () => {
  const item = geneData[button.dataset.gene];
  $$('.gene-tab').forEach(b => {
    const active = b === button;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $('#diagram-gene').textContent = item.code;
  $('#gene-tag').textContent = item.tag;
  $('#gene-title').textContent = item.title;
  $('#gene-body').textContent = item.body;
  $('#gene-facts').replaceChildren(...item.facts.map(fact => {
    const chip = document.createElement('span');
    chip.textContent = fact;
    return chip;
  }));
  $('#gene-source').href = `assets/tesi.pdf#page=${item.page}`;
}));

const cohortData = {
  service: '20 pazienti senza varianti rare nei geni causativi di FH nel test iniziale, con WES eseguito tramite servizio esterno.',
  negative: '61 pazienti per i quali l’analisi iniziale non aveva identificato varianti considerate causative nei principali geni associati all’FH.',
  positive: '11 pazienti con varianti patogeniche o probabilmente patogeniche nei geni canonici LDLR, APOB o PCSK9, compatibili con diagnosi molecolare di FH.'
};
$$('.cohort-item').forEach(button => button.addEventListener('click', () => {
  $$('.cohort-item').forEach(b => {
    b.classList.toggle('active', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  });
  $('#cohort-description').textContent = cohortData[button.dataset.cohort];
}));

// All seven observations-per-cohort totals are transcribed from thesis Table 2 (printed p. 22).
const pipeline = [
  { label:'00 / DATI INIZIALI', value:2531511, mean:'27.516,4', title:'Tutte le varianti annotate.', description:'Punto di partenza: 2.531.511 osservazioni di varianti genomiche annotate con ANNOVAR, raccolte nei 92 esomi prima dell’applicazione dei filtri.' },
  { label:'01 / QUALITÀ', value:2296449, mean:'24.961,4', title:'Controllo della qualità.', description:'Sono mantenute le chiamate con profondità di lettura DP ≥ 20 e qualità del genotipo GQ ≥ 20.' },
  { label:'02 / VARIANT ALLELE FREQUENCY', value:2045233, mean:'22.230,8', title:'Coerenza della frequenza allelica.', description:'Filtro VAF: 0,35–0,65 nei genotipi eterozigoti e 0,85–1,00 nei genotipi omozigoti alternativi.' },
  { label:'03 / RARITÀ', value:532379, mean:'5.786,7', title:'La rarità come primo indizio.', description:'Restano varianti con frequenza allelica in gnomAD exomes inferiore all’1%, oppure senza frequenza disponibile.' },
  { label:'04 / CONSEGUENZA FUNZIONALE', value:52578, mean:'571,5', title:'Dove possono agire le varianti?', description:'La selezione si concentra sulle regioni esoniche e di splicing; le varianti sinonime non vengono escluse automaticamente.' },
  { label:'05 / PRIORITIZZAZIONE', value:12915, mean:'140,4', title:'Predire un possibile impatto.', description:'REVEL ≥ 0,644 oppure CADD > 25,3; sono previste eccezioni per specifiche varianti potenzialmente rilevanti prive di entrambi i punteggi.' },
  { label:'06 / FILTRO IN COORTE', value:10020, mean:'108,9', title:'La lista finale delle candidate.', description:'Esclusione delle varianti ricorrenti in più del 50% dei pazienti. Rimangono 10.020 osservazioni, equivalenti in media a 108,9 varianti per paziente.' }
];
$$('.pipeline-stage').forEach(button => button.addEventListener('click', () => {
  const i = Number(button.dataset.stage);
  const step = pipeline[i];
  $$('.pipeline-stage').forEach(b => {
    b.classList.toggle('active', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  });
  $('#pipeline-step-label').textContent = step.label;
  $('#pipeline-active-value').textContent = fmt.format(step.value);
  $('#pipeline-reduction').textContent = `${fmt.format((1 - step.value / pipeline[0].value) * 100)}%`;
  $('#stage-detail-title').textContent = step.title;
  $('#stage-detail-body').textContent = step.description;
  $('#stage-per-patient').textContent = step.mean;
}));

// AAVC classes are derived from thesis Table 3 (printed p. 23).
const classification = {
  P: { title:'Patogenica', count:70, pct:'1,35%' },
  LP: { title:'Probabilmente patogenica', count:472, pct:'9,13%' },
  'VUS-H': { title:'Significato incerto, livello alto', count:270, pct:'5,22%' },
  'VUS-M': { title:'Significato incerto, livello intermedio', count:716, pct:'13,85%' },
  'VUS-L': { title:'Significato incerto, livello basso', count:1874, pct:'36,26%' },
  LB: { title:'Probabilmente benigna', count:1573, pct:'30,44%' },
  B: { title:'Benigna', count:141, pct:'2,73%' },
  NC: { title:'Non classificata', count:52, pct:'1,01%' }
};
$$('.class-pill').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.class;
  const cl = classification[key];
  $$('.class-pill').forEach(b => b.classList.toggle('active', b === button));
  $('#class-selected-code').textContent = `${key === 'NC' ? 'UNCLASSIFIED' : key} / AAVC`;
  $('#class-selected-name').textContent = cl.title;
  $('#class-selected-pct').textContent = cl.pct;
  $('#class-selected-count').textContent = `${fmt.format(cl.count)} VARIANTI`;
  const keys = Object.keys(classification);
  $$('.stacked-bar span').forEach((bar, index) => { bar.style.opacity = keys[index] === key ? '1' : '.27'; });
}));

// Strategies are transcribed from thesis Table 4 (printed p. 25).
const strategies = {
  S0: { profile:'BASELINE / S0', maf:'< 0,01', revel:'≥ 0,644', variants:1289, genes:1002, patients:92, pathways:678, note:'La strategia di riferimento conserva l’insieme più ampio di varianti tra quelli confrontati.' },
  S1: { profile:'HIGH REVEL / S1', maf:'< 0,01', revel:'≥ 0,932', variants:98, genes:93, patients:62, pathways:96, note:'Aumentare la soglia REVEL riduce nettamente il numero di varianti selezionate rispetto alla baseline.' },
  S2: { profile:'HIGH STRINGENCY / S2', maf:'< 0,001', revel:'≥ 0,932', variants:84, genes:80, patients:55, pathways:95, note:'Una soglia di rarità più severa riduce ancora il dataset, con un numero di pathway vicino a quello di S1.' },
  S3: { profile:'BALANCED / S3', maf:'< 0,001', revel:'≥ 0,879', variants:203, genes:194, patients:82, pathways:184, note:'Il REVEL meno stringente amplia i candidati. Dopo la rimozione di una variante multi-gene UGT1A, rimangono 202 varianti, 185 geni e 184 pathway significativi.' }
};
$$('.strategy-tab').forEach(button => button.addEventListener('click', () => {
  $$('.strategy-tab').forEach(b => {
    b.classList.toggle('active', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  });
  const data = strategies[button.dataset.strategy];
  $('#strategy-profile').textContent = data.profile;
  $('#strategy-maf').textContent = data.maf;
  $('#strategy-revel').textContent = data.revel;
  $('#strategy-variants').textContent = fmt.format(data.variants);
  $('#strategy-genes').textContent = fmt.format(data.genes);
  $('#strategy-patients').textContent = fmt.format(data.patients);
  $('#strategy-pathways').textContent = fmt.format(data.pathways);
  $('#strategy-description').textContent = data.note;
}));

// Illustrative PCA scatter: intentionally NOT the raw study observations.
const scatterContainer = $('#scatter-dots');
let scatterSeed = 1457;
function random() { scatterSeed = (scatterSeed * 1664525 + 1013904223) >>> 0; return scatterSeed / 4294967296; }
const svgNamespace = 'http://www.w3.org/2000/svg';
for (let i = 0; i < 56; i++) {
  const x = Math.max(27, Math.min(267, 144 + (random()+random()+random()-1.5)*97));
  const y = Math.max(19, Math.min(125, 71 + (random()+random()+random()-1.5)*78));
  const circle = document.createElementNS(svgNamespace, 'circle');
  circle.setAttribute('cx', x.toFixed(1));
  circle.setAttribute('cy', y.toFixed(1));
  circle.setAttribute('r', (1.8 + random()*2.1).toFixed(1));
  circle.setAttribute('fill', i%7===0 ? '#4a947c' : i%4===0 ? '#b1c774' : '#91afa6');
  circle.setAttribute('opacity', String(.52 + random()*.35));
  scatterContainer.append(circle);
}

// Original thesis figure zoom, keyboard Escape supported by the native <dialog>.
const lightbox = $('#lightbox');
const lightboxImg = $('#lightbox-image');
let previouslyFocused = null;
$$('.figure-card').forEach(card => card.addEventListener('click', () => {
  previouslyFocused = card;
  lightboxImg.src = card.dataset.image;
  lightboxImg.alt = $('img', card).alt;
  $('#lightbox-caption').textContent = card.dataset.caption;
  if (typeof lightbox.showModal === 'function') lightbox.showModal();
  else lightbox.setAttribute('open', '');
}));
$('#lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener('close', () => previouslyFocused?.focus());

// Share this GitHub Pages URL once published; also works with ordinary HTTPS hosting.
$('#share-button').addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  const name = 'Oltre i geni noti — Paolo Maddaluno';
  if (navigator.share && /^https?:/.test(location.protocol)) {
    try { await navigator.share({ title:name, url }); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    else {
      const input = document.createElement('textarea');
      input.value = url; document.body.append(input); input.select();
      document.execCommand('copy'); input.remove();
    }
    const label = $('#share-text');
    label.textContent = 'Link copiato ✓';
    setTimeout(() => { label.textContent = 'Condividi il progetto'; }, 2200);
  } catch {
    prompt('Copia il link del progetto:', url);
  }
});
$('#year').textContent = String(new Date().getFullYear());

// High-DPI, time-based helix. Decorative visualization, never representing patient sequences.
const dna = $('#dna-canvas');
const ctx = dna.getContext('2d', { alpha: true });
if (ctx) {
  let width = 0, height = 0, lastDraw = 0;
  let helixVisible = true;
  const resize = () => {
    const rect = dna.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    dna.width = Math.round(width * dpr);
    dna.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize, { passive:true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { helixVisible = entries[0].isIntersecting; }, { threshold:0 }).observe(dna);
  }
  function paint(ts) {
    requestAnimationFrame(paint);
    if (!helixVisible || document.hidden || (ts-lastDraw < 30 && !motionReduced)) return;
    if (motionReduced && lastDraw) return;
    lastDraw = ts;
    ctx.clearRect(0, 0, width, height);
    const t = motionReduced ? .7 : ts * .00025;
    const cx = width * .52;
    const r = Math.min(width * .29, 185);
    const margin = height * .095;
    const yspan = height - margin * 2;
    const steps = 104;
    function sample(i, strand) {
      const u = i/steps;
      const angle = u * Math.PI * 6.1 + t * 2.0;
      const d = strand ? Math.PI : 0;
      const depth = Math.sin(angle + d);
      return {
        x: cx + Math.cos(angle + d)*r * (.92 + .08*Math.sin(u*5.5)),
        y: margin + u*yspan,
        z: depth
      };
    }
    // Soft axis and target markings.
    ctx.strokeStyle = 'rgba(139,221,179,.1)';
    ctx.setLineDash([3, 12]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();
    ctx.setLineDash([]);
    for (let i=0; i<=steps; i+=3) {
      const a = sample(i,0), b = sample(i,1);
      const bright = .17 + .39*(1+a.z)/2;
      ctx.strokeStyle = `rgba(141,230,182,${bright})`;
      ctx.lineWidth = 1 + (a.z+1)*.4;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    }
    // Draw back-facing strand first, then highlight near-facing strand.
    for (let strand=0; strand<2; strand++) {
      for (let i=0; i<steps; i++) {
        const a = sample(i,strand), b=sample(i+1,strand);
        const alpha = .25 + .6*(1+(a.z+b.z)/2)/2;
        ctx.strokeStyle = strand === 0 ? `rgba(183,255,118,${alpha})` : `rgba(98,216,200,${alpha})`;
        ctx.shadowColor = strand===0?'#b7ff76':'#65d6c2';
        ctx.shadowBlur = alpha*11;
        ctx.lineWidth = 1.6 + (alpha*1.45);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      ctx.shadowBlur = 0;
      for (let i=0; i<=steps; i+=7) {
        const p=sample(i,strand);
        const radius=1.8+(p.z+1)*1.2;
        ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);
        ctx.fillStyle = strand===0?'#b7ff76':'#73dcca';ctx.fill();
        if(i%21===0) {
          ctx.beginPath();ctx.arc(p.x,p.y,radius*3,0,Math.PI*2);
          ctx.strokeStyle = strand===0?'rgba(183,255,118,.27)':'rgba(115,220,202,.25)';ctx.lineWidth=1;ctx.stroke();
        }
      }
    }
    // Scientific display markings.
    ctx.font='10px monospace';ctx.fillStyle='rgba(128,195,156,.5)';
    for(let i=0;i<8;i++){
      const y=margin+i*yspan/7;
      ctx.fillRect(cx+r+32,y,10,1);
      if(i%2===0)ctx.fillText(String(i*12).padStart(2,'0'),cx+r+48,y+3);
    }
  }
  requestAnimationFrame(paint);
}
