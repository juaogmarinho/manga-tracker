const currentAccount=activeUser();
const KEY=currentAccount?`kitsune-tracker-v1:${currentAccount.id}`:'kitsune-tracker-v1:guest';
const defaults=['Ação','Romance','Comédia','Fantasia','Isekai','Shounen','Seinen','Drama','Terror','Slice of Life'];
const statuses=['Quero assistir/ler','Assistindo/Lendo','Pausado','Completo','Abandonado'];
const authThemeKey='kitsune-auth-theme';
let state=load(), editingCover='', activeQuick='';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));return d&&Array.isArray(d.works)?{works:d.works,categories:[...new Set([...(d.categories||[]),...defaults])]}:{works:[],categories:defaults}}catch{return{works:[],categories:defaults}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();window.cloudSave?.(state)}
function getAuthTheme(){try{return JSON.parse(localStorage.getItem(authThemeKey))||{}}catch{return {}}}
function setAuthTheme(value){localStorage.setItem(authThemeKey,JSON.stringify(value||{}));applyAuthTheme();}
function applyAuthTheme(){const visual=$('.auth-visual');if(!visual)return;const theme=getAuthTheme();const url=(theme&&theme.url)?theme.url:'';visual.style.setProperty('--auth-visual-bg-image', url?`url("${url.replace(/"/g,'\\"')}")`: 'none');}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dateText(v){return v?new Intl.DateTimeFormat('pt-BR').format(new Date(v+'T12:00:00')):'—'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function render(){renderStats();renderDashboardHighlights();renderContinue();renderRecommendations();renderLibrary();}
function progress(w){return w.total?Math.min(100,Math.round(w.current/w.total*100)):0}
function card(w){const cover=w.cover?`style="background-image:url('${esc(w.cover)}')"`:'';const label=w.type==='Anime'?'Episódio':'Capítulo';return `<article class="work-card" data-id="${w.id}"><div class="cover" ${cover}><span class="card-type">${w.type}</span>${!w.cover?'✦':''}</div><div class="card-info"><h3 title="${esc(w.name)}">${esc(w.name)}</h3><div class="card-meta"><span>${esc(w.status)}</span><span>${label} ${w.current}${w.total?' / '+w.total:''}</span></div><div class="progressbar"><i style="width:${progress(w)}%"></i></div>${w.url?'<div class="card-actions"><button class="mini-btn external">↗ Abrir</button></div>':''}</div></article>`}
function renderStats(){const c={total:state.works.length,anime:state.works.filter(w=>w.type==='Anime'&&w.status==='Assistindo/Lendo').length,manga:state.works.filter(w=>w.type==='Mangá'&&w.status==='Assistindo/Lendo').length,complete:state.works.filter(w=>w.status==='Completo').length,paused:state.works.filter(w=>w.status==='Pausado').length};$('#stats').innerHTML=[['▣','Obras cadastradas',c.total],['◎','Animes assistindo',c.anime],['▤','Mangás lendo',c.manga],['✓','Completos',c.complete],['⏸','Pausados',c.paused]].map(x=>`<div class="stat"><span class="icon">${x[0]}</span><small>${x[1]}</small><div class="number">${x[2]}</div></div>`).join('')}
function makeCoverArt(title, accent, accent2) {
  const label = String(title || 'Kitsune').slice(0, 18).toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}"/>
          <stop offset="100%" stop-color="${accent2}"/>
        </linearGradient>
      </defs>
      <rect width="900" height="620" fill="url(#g1)"/>
      <circle cx="760" cy="110" r="200" fill="rgba(255,255,255,0.12)"/>
      <circle cx="140" cy="560" r="180" fill="rgba(0,0,0,0.12)"/>
      <path d="M160 520C220 420 320 350 420 330C540 308 660 348 760 430L900 620L0 620L0 520Z" fill="rgba(10,12,18,0.18)"/>
      <text x="60" y="300" font-size="74" font-family="Georgia, serif" font-weight="700" fill="rgba(255,255,255,0.95)" letter-spacing="8">${label}</text>
      <text x="60" y="370" font-size="28" font-family="Arial, sans-serif" fill="rgba(255,255,255,0.82)" letter-spacing="7">RECOMENDO LER</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function renderRecommendations(){
  const recommendations = [
    { title: 'Frieren: Além do Fim do Viaje', type: 'Slice of Life / Fantasia', blurb: 'Uma jornada tranquila, profunda e memorável.', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1xlGYFjwQcKcruvn3uZRR88jWC3JZ4mGbRAuRRAfPfg&s=10' },
    { title: 'Vinland Saga', type: 'Drama / Ação', blurb: 'História intensa, humana e muito bem escrita.', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTdaQfG_m3XfVMDCVPdNcdFwUfY_xfXQJkBNKb5E1twQ&s=10' },
    { title: 'Berserk', type: 'Fantasia Sombria', blurb: 'Uma leitura brutal, intensa e lendária.', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvIjFxjtkiS4vfNUEIfeKtDCiQ3NAD-Bx6s0C8OShwGg&s' },
    { title: 'Solo Leveling', type: 'Ação / Fantasia', blurb: 'Poder, ritmo e evolução constantes.', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFBMN4Q1QdSXOrsXqHPl2yWnIA3JmRTHBuyenW7gotyg&s=10' }
  ];
  const list = document.querySelector('#recommendationsList');
  if (!list) return;

  const buildCard = item => {
    const fallbackCover = makeCoverArt(item.title, item.accent || '#7a6cff', item.accent2 || '#ff7f6a');
    const cover = item.cover ? encodeURI(item.cover) : fallbackCover;
    return `
      <article class="recommendation-card">
        <div class="recommendation-cover" style="background-image:linear-gradient(180deg, rgba(7,8,14,.15), rgba(7,8,14,.5)), url('${cover}')"></div>
        <div class="recommendation-body">
          <span class="recommendation-tag">Recomendado</span>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.type)}</p>
          <small>${esc(item.blurb)}</small>
        </div>
      </article>
    `;
  };

  list.innerHTML = `
    <div class="recommendations-track">
      ${recommendations.map(buildCard).join('')}
      ${recommendations.map(buildCard).join('')}
    </div>
  `;
}
function renderDashboardHighlights(){
  const dash = document.querySelector('#dashboard');
  if (!dash) return;
  const current = [...state.works].filter(w => w.status === 'Assistindo/Lendo');
  const featured = [...state.works].sort((a,b) => {
    const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (ratingDiff) return ratingDiff;
    return new Date(b.updatedAt || b.endDate || b.startDate || 0) - new Date(a.updatedAt || a.endDate || a.startDate || 0);
  }).slice(0, 4);
  const mangaPick = state.works.filter(w => w.type === 'Mangá').sort((a,b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0];
  const animePick = state.works.filter(w => w.type === 'Anime').sort((a,b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0];
  const completionRate = state.works.length ? Math.round((state.works.filter(w => w.status === 'Completo').length / state.works.length) * 100) : 0;
  const nextTitle = current[0] || state.works[0] || null;

  if (!dash.querySelector('.overview-panels')) {
    dash.insertAdjacentHTML('beforeend', `
      <div class="overview-panels">
        <div class="overview-summary">
          <article class="summary-tile summary-tile--primary">
            <small>Próximo alvo</small>
            <strong>${nextTitle ? esc(nextTitle.name) : 'Nenhuma obra'}</strong>
            <span>${nextTitle ? `${nextTitle.type} · ${nextTitle.status}` : 'Acompanhe sua jornada'}</span>
          </article>
          <article class="summary-tile summary-tile--warm">
            <small>Conclusão</small>
            <strong>${completionRate}%</strong>
            <span>das obras finalizadas</span>
          </article>
          <article class="summary-tile summary-tile--muted">
            <small>Em andamento</small>
            <strong>${current.length}</strong>
            <span>títulos em progresso</span>
          </article>
        </div>
        <div class="overview-feature-list"></div>
      </div>
    `);
  }

  const featureList = dash.querySelector('.overview-feature-list');
  const tiles = [
    { label: 'Mangá em destaque', title: mangaPick ? esc(mangaPick.name) : 'Ainda sem mangá', meta: mangaPick ? `${mangaPick.status} · Nota ${mangaPick.rating || '—'}` : 'Adicione mangás para destacar', tone: 'manga' },
    { label: 'Anime em destaque', title: animePick ? esc(animePick.name) : 'Ainda sem anime', meta: animePick ? `${animePick.status} · Nota ${animePick.rating || '—'}` : 'Adicione animes para destacar', tone: 'anime' },
    { label: 'Mais bem avaliado', title: featured[0] ? esc(featured[0].name) : 'Sem avaliações', meta: featured[0] ? `${featured[0].type} · ${featured[0].rating || 0}/10` : 'Avalie suas obras', tone: 'score' }
  ];

  featureList.innerHTML = tiles.map(tile => `
    <article class="feature-card ${tile.tone}">
      <span class="feature-label">${tile.label}</span>
      <h3>${tile.title}</h3>
      <p>${tile.meta}</p>
    </article>
  `).join('');

  if (!featureList.dataset.initialized) {
    featureList.dataset.initialized = 'true';
  }
}
function renderContinue(){const works=state.works.filter(w=>w.status==='Assistindo/Lendo');$('#continueList').innerHTML=works.length?works.map(card).join(''):`<div class="empty">Ainda não há nada em andamento.<br><button class="text-button empty-add">Adicionar sua primeira obra →</button></div>`}
const sorters={recent:(a,b)=>0,name:(a,b)=>a.name.localeCompare(b.name,'pt-BR'),rating:(a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0),progress:(a,b)=>progress(b)-progress(a),updated:(a,b)=>new Date(b.endDate||b.startDate||0)-new Date(a.endDate||a.startDate||0)};
function renderLibrary(){const type=$('#typeFilter').value,status=$('#statusFilter').value,cat=$('#categoryFilter').value,sort=$('#sortFilter')?.value||'recent',q=$('#search').value.trim().toLowerCase();$('#statusFilter').innerHTML='<option value="">Todos os status</option>'+statuses.map(s=>`<option ${status===s?'selected':''}>${s}</option>`).join('');$('#categoryFilter').innerHTML='<option value="">Todas as categorias</option>'+state.categories.map(s=>`<option ${cat===s?'selected':''}>${s}</option>`).join('');const quick=[['','Todos'],['Anime','Anime'],['Mangá','Mangá'],...statuses.map(x=>[x,x])];$('#quickFilters').innerHTML=quick.map(([v,n])=>`<button class="pill ${activeQuick===v?'active':''}" data-quick="${v}">${n}</button>`).join('');const hasFilters=type||status||cat||q||activeQuick||(sort!=='recent');const clearBtn=$('#clearFilters');if(clearBtn)clearBtn.hidden=!hasFilters;let works=state.works.filter(w=>(!type||w.type===type)&&(!status||w.status===status)&&(!cat||(w.categories||[]).includes(cat))&&(!q||w.name.toLowerCase().includes(q)||(w.categories||[]).some(c=>c.toLowerCase().includes(q))));if(activeQuick)works=works.filter(w=>w.type===activeQuick||w.status===activeQuick);if(sorters[sort])works=[...works].sort(sorters[sort]);const countEl=$('#resultCount');if(countEl)countEl.textContent=works.length?`${works.length} obra${works.length===1?'':'s'} encontrada${works.length===1?'':'s'}`:'';$('#libraryList').innerHTML=works.length?works.map(card).join(''):`<div class="empty">Nenhuma obra encontrada.<br><button class="text-button empty-add">Adicionar obra →</button></div>`}
function updateProgress(id,delta){const w=state.works.find(x=>x.id===id);w.current=Math.max(0,Number(w.current)+delta);if(w.total&&w.current>=w.total&&w.status!=='Completo'){if(confirm(`Você chegou ao total de ${w.type==='Anime'?'episódios':'capítulos'}! Marcar como Completo?`)){w.status='Completo';w.endDate=new Date().toISOString().slice(0,10)}}save()}
function openForm(work){const f=$('#workForm');f.reset();$('#workId').value=work?.id||'';editingCover=work?.cover||'';$('#coverUrl').value='';if(work?.cover){const coverValue = String(work.cover).trim();const isHttp = /^https?:\/\//i.test(coverValue);$('#coverUrl').value = isHttp ? coverValue : '';if(!isHttp) editingCover = coverValue;}$('#formTitle').textContent=work?'Editar obra':'Adicionar à biblioteca';$('#formKicker').textContent=work?'EDITAR OBRA':'NOVA OBRA';$('#status').innerHTML=statuses.map(s=>`<option>${s}</option>`).join('');if(work){for(const k of ['name','type','status','current','total','url','rating','startDate','endDate','notes'])$('#'+k).value=work[k]??''}$('#coverPreview').style.backgroundImage=editingCover?`url('${editingCover}')`:'';$('#coverPreview').innerHTML=editingCover?'': '<span>＋</span><small>Adicionar capa</small>' ;$('#removeCover').hidden=!editingCover;renderCategories(work?.categories||[]);progressName();$('#formError').textContent='';$('#workDialog').showModal()}
function renderCategories(chosen=[]){$('#categoryChoices').innerHTML=state.categories.map(c=>`<label class="category-check"><input type="checkbox" value="${esc(c)}" ${chosen.includes(c)?'checked':''}>${esc(c)}</label>`).join('')}
function progressName(){$('#progressLabel').textContent=$('#type').value==='Anime'?'Episódio atual':'Capítulo atual'}
function submitForm(e){e.preventDefault();const f=e.currentTarget,name=$('#name').value.trim(),url=$('#url').value.trim(),coverUrl=$('#coverUrl').value.trim(),cur=Number($('#current').value),total=$('#total').value?Number($('#total').value):null;if(!name){return $('#formError').textContent='Informe o nome da obra.'}if(url){try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))throw 0}catch{return $('#formError').textContent='Informe uma URL válida começando por http:// ou https://'}}if(coverUrl){try{const u=new URL(coverUrl);if(!['http:','https:'].includes(u.protocol))throw 0;editingCover=coverUrl;}catch{return $('#formError').textContent='Informe uma URL de capa válida começando por http:// ou https://'}}const finalCover = editingCover || coverUrl || '';if(total&&cur>total&&!confirm('O progresso é maior que o total. Deseja salvar mesmo assim?'))return;const id=$('#workId').value;const work={id:id||crypto.randomUUID(),name,type:$('#type').value,status:$('#status').value,current:cur,total,categories:$$('#categoryChoices input:checked').map(i=>i.value),url,rating:$('#rating').value,startDate:$('#startDate').value,endDate:$('#endDate').value,notes:$('#notes').value.trim(),cover:finalCover};if(!work.endDate&&work.status==='Completo')work.endDate=new Date().toISOString().slice(0,10);if(id)state.works=state.works.map(w=>w.id===id?work:w);else state.works.unshift(work);save();$('#workDialog').close();toast(id?'Obra atualizada!':'Obra adicionada à biblioteca!')}
function showDetail(id){const w=state.works.find(x=>x.id===id);if(!w)return;const cats=w.categories||[];const label=w.type==='Anime'?'Episódio':'Capítulo',cover=w.cover?`style="background-image:url('${esc(w.cover)}')"`:'';$('#detailContent').innerHTML=`<div class="detail" data-id="${w.id}"><div class="detail-cover" ${cover}></div><div class="detail-body"><button class="close" data-close style="float:right">×</button><span class="badge">${esc(w.status)}</span><h2>${esc(w.name)}</h2><p style="color:var(--muted);margin:5px 0">${w.type} · ${label} ${w.current}${w.total?' de '+w.total:''}</p><div class="progressbar"><i style="width:${progress(w)}%"></i></div><div class="quick"><button class="secondary detail-minus">−</button><b>${label} ${w.current}</b><button class="secondary detail-plus">＋</button></div><div class="detail-grid"><div class="detail-item"><small>Categorias</small><div class="tags">${cats.length?cats.map(c=>`<span class="tag">${esc(c)}</span>`).join(''):'—'}</div></div><div class="detail-item"><small>Nota pessoal</small><div>${w.rating?`${w.rating} / 10`:'—'}</div></div><div class="detail-item"><small>Início</small><div>${dateText(w.startDate)}</div></div><div class="detail-item"><small>Conclusão</small><div>${dateText(w.endDate)}</div></div><div class="detail-item" style="grid-column:1/-1"><small>Observações</small><div>${esc(w.notes)||'—'}</div></div></div><div class="detail-actions"><button class="secondary edit-work">Editar</button><button class="secondary status-work">Alterar status</button>${w.url?'<a class="secondary" target="_blank" rel="noopener" href="'+esc(w.url)+'">↗ Abrir página</a>':''}<button class="secondary danger delete-work">Excluir</button></div></div></div>`;$('#detailDialog').showModal()}
function manageCategories(){const list=$('#categoryManageList');list.innerHTML=state.categories.map(c=>`<span class="manage-category">${esc(c)} <button type="button" data-category="${esc(c)}">×</button></span>`).join('');$('#categoryDialog').showModal()}
function importData(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data||!Array.isArray(data.works)||!Array.isArray(data.categories)||!data.works.every(w=>w.id&&w.name&&['Anime','Mangá'].includes(w.type)))throw Error();if(!confirm(`Importar ${data.works.length} obras? Isto substituirá sua biblioteca atual.`))return;state={works:data.works.map(w=>({categories:[],...w})),categories:[...new Set([...defaults,...data.categories])]};save();toast('Backup restaurado com sucesso!')}catch{alert('Arquivo inválido. Selecione um backup JSON do Kitsune.')}};r.readAsText(file)}
document.addEventListener('click',e=>{const btn=e.target.closest('button');if(e.target.matches('.nav-link')){const v=e.target.dataset.view;$$('.view,.nav-link').forEach(x=>x.classList.remove('active'));$('#'+v).classList.add('active');e.target.classList.add('active');const titles={dashboard:'Olá, Otaku ✦',library:'Minha biblioteca',settings:'Configurações',admin:'Administração',vip:'Área VIP'};$('#pageTitle').textContent=titles[v]||e.target.textContent.trim();$('.sidebar').classList.remove('open')}if(e.target.closest('[data-go]')){document.querySelector('[data-view="library"]').click()}if(e.target.closest('#addNew,#addTop,#heroAdd,#libraryAdd,.empty-add'))openForm();if(e.target.closest('[data-close]'))e.target.closest('dialog').close();if(e.target.closest('.work-card')){const card=e.target.closest('.work-card'),id=card.dataset.id;if(e.target.closest('.quick-plus'))return updateProgress(id,1);if(e.target.closest('.quick-minus'))return updateProgress(id,-1);if(e.target.closest('.external'))return window.open(state.works.find(w=>w.id===id).url,'_blank','noopener');showDetail(id)}const detailId=$('#detailContent .detail')?.dataset.id;if(btn?.classList.contains('detail-plus')){updateProgress(detailId,1);showDetail(detailId)}if(btn?.classList.contains('detail-minus')){updateProgress(detailId,-1);showDetail(detailId)}if(btn?.classList.contains('edit-work')){const w=state.works.find(w=>w.id===detailId);$('#detailDialog').close();openForm(w)}if(btn?.classList.contains('delete-work')){const w=state.works.find(w=>w.id===detailId);if(confirm(`Excluir “${w.name}”? Esta ação não pode ser desfeita.`)){state.works=state.works.filter(x=>x.id!==w.id);save();$('#detailDialog').close();toast('Obra excluída.')}}if(btn?.classList.contains('status-work')){const w=state.works.find(w=>w.id===detailId),i=statuses.indexOf(w.status);w.status=statuses[(i+1)%statuses.length];save();showDetail(w.id);toast('Status alterado para '+w.status)}if(e.target.matches('[data-quick]')){activeQuick=e.target.dataset.quick;renderLibrary()}if(e.target.id==='exportData'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='kitsune-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);toast('Backup exportado!')}if(e.target.id==='manageCategories')manageCategories();if(e.target.matches('[data-category]')){const c=e.target.dataset.category;if(confirm(`Remover a categoria “${c}”?`)){state.categories=state.categories.filter(x=>x!==c);state.works.forEach(w=>w.categories=w.categories.filter(x=>x!==c));save();manageCategories()}}if(e.target.classList.contains('menu-btn'))$('.sidebar').classList.toggle('open')});
$('#workForm').addEventListener('submit',submitForm);$('#type').addEventListener('change',progressName);$('#coverInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(file.size>2.5*1024*1024){$('#formError').textContent='Escolha uma imagem de até 2,5 MB.';return}const r=new FileReader();r.onload=()=>{editingCover=r.result;$('#coverUrl').value='';$('#coverPreview').style.backgroundImage=`url('${editingCover}')`;$('#coverPreview').innerHTML='';$('#removeCover').hidden=false};r.readAsDataURL(file)});$('#coverUrl').addEventListener('input',e=>{const value=e.target.value.trim();if(!value){if(!editingCover){$('#coverPreview').style.backgroundImage='';$('#coverPreview').innerHTML='<span>＋</span><small>Adicionar capa</small>';}return}if(/^https?:\/\//i.test(value)){editingCover=value;$('#coverPreview').style.backgroundImage=`url('${value}')`;$('#coverPreview').innerHTML='';$('#removeCover').hidden=false}else if(editingCover && !value.startsWith('data:')){editingCover='';$('#coverPreview').style.backgroundImage='';$('#coverPreview').innerHTML='<span>＋</span><small>Adicionar capa</small>';$('#removeCover').hidden=true}});$('#removeCover').onclick=()=>{editingCover='';$('#coverUrl').value='';$('#coverPreview').style.backgroundImage='';$('#coverPreview').innerHTML='<span>＋</span><small>Adicionar capa</small>';$('#removeCover').hidden=true};$('#newCategory').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const c=e.target.value.trim();if(c&&!state.categories.some(x=>x.toLowerCase()===c.toLowerCase())){state.categories.push(c);save();renderCategories($$('#categoryChoices input:checked').map(i=>i.value).concat(c));e.target.value=''}}});$('#clearFilters')?.addEventListener('click',()=>{$('#search').value='';$('#typeFilter').value='';$('#statusFilter').value='';$('#categoryFilter').value='';if($('#sortFilter'))$('#sortFilter').value='recent';activeQuick='';renderLibrary()});['search','typeFilter','statusFilter','categoryFilter','sortFilter'].forEach(id=>$('#'+id)?.addEventListener('input',renderLibrary));$('#categoryForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#categoryName').value.trim();if(v&&!state.categories.some(x=>x.toLowerCase()===v.toLowerCase())){state.categories.push(v);save();$('#categoryName').value='';manageCategories()}});$('#importData').addEventListener('change',e=>importData(e.target.files[0]));
const loginBackgroundPreset=$('#loginBackgroundPreset');
const loginBackgroundUrl=$('#loginBackgroundUrl');
const applyLoginBackground=$('#applyLoginBackground');
function syncLoginBackgroundFields(){const theme=getAuthTheme();const selected=theme.url||'';const options=[...document.querySelectorAll('#loginBackgroundPreset option')].map(o=>o.value);if(!loginBackgroundPreset)return;if(options.includes(selected)){loginBackgroundPreset.value=selected;loginBackgroundUrl.value='';}else if(selected){loginBackgroundPreset.value='custom';loginBackgroundUrl.value=selected;}else{loginBackgroundPreset.value='';loginBackgroundUrl.value='';}}
applyLoginBackground?.addEventListener('click',()=>{
  const preset=loginBackgroundPreset.value;
  const customUrl=loginBackgroundUrl.value.trim();
  const nextUrl=preset==='custom'?customUrl:preset || '';
  if(nextUrl && !/^https?:\/\//i.test(nextUrl)){toast('Insira uma URL válida começando por http:// ou https://');return;}
  setAuthTheme(nextUrl?{url:nextUrl}:{url:''});
  syncLoginBackgroundFields();
  toast(nextUrl?'Fundo do login atualizado!':'Fundo padrão restaurado!');
});
loginBackgroundPreset?.addEventListener('change',()=>{
  if(loginBackgroundPreset.value && loginBackgroundPreset.value !== 'custom'){
    loginBackgroundUrl.value=loginBackgroundPreset.value;
  }
  if(loginBackgroundPreset.value === 'custom'){
    loginBackgroundUrl.focus();
  }
});
window.mergeGlobalCategories=list=>{if(!Array.isArray(list)||!list.length)return;const merged=[...new Set([...state.categories,...list])];if(merged.length!==state.categories.length){state.categories=merged;save()}};
$('#today').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
applyAuthTheme();
syncLoginBackgroundFields();
render();