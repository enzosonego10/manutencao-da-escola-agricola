const K='etec-manut-v1',$=(s,r=document)=>r.querySelector(s);
const S={a:'Aberto',p:'Em andamento',m:'Aguardando material',c:'Concluído',x:'Cancelado'},SI={a:'circle-dot',p:'wrench',m:'package',c:'check',x:'ban'};
const P={1:'Baixa',2:'Média',3:'Alta',4:'Urgente'},PI={1:'arrow-down',2:'minus',3:'arrow-up',4:'flame'};
const arr=o=>Object.fromEntries(o.map(x=>[x,x]));
const EQ=['Elétrica','Hidráulica','Alvenaria e pintura','Jardinagem e máquinas','Empresa terceirizada'];
const TL=['Sala de aula','Laboratório','Alojamento','Instalação','Área externa','Administrativo'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const iso=t=>new Date(t-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const hoje=()=>iso(Date.now());
const dt=s=>s?s.slice(0,10).split('-').reverse().join('/'):'—';
const icons=()=>window.lucide&&lucide.createIcons();
try{document.documentElement.dataset.theme=localStorage.getItem('etec-theme')==='dark'?'dark':'light'}catch(_){document.documentElement.dataset.theme='light'}
function themeButton(){const dark=document.documentElement.dataset.theme==='dark',b=$('#theme-toggle');b.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');b.innerHTML=`<i aria-hidden="true" data-lucide="${dark?'sun':'moon'}"></i>`}

let db={l:[],e:[],c:[],a:[],k:[],i:[]},user=null,csrf='',lastInviteUrl='';
const admin=()=>user?.role==='admin';
const api=async(action,body={})=>{
 const response=await fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,csrf,...body})});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||'Não foi possível salvar.');
 return data;
};
const load=async()=>{
 const response=await fetch('api.php',{cache:'no-store'}),data=await response.json();
 if(!response.ok)throw Error(data.error||'Não foi possível carregar os dados.');
 user=data.user;csrf=data.csrf;db=data.db||{l:[],e:[],c:[],a:[],k:[]};
};
const by=(a,id)=>a.find(x=>x.id==id);
const tot=id=>db.k.filter(k=>k.chId===id).reduce((s,k)=>s+k.q*k.v,0);
const open=c=>'apm'.includes(c.st);
const loc=c=>esc(by(db.l,c.localId)?.nome);
const dias=c=>Math.max(0,Math.round((Date.now()-new Date(c.aberto+'T00:00'))/864e5));
const lo=()=>Object.fromEntries(db.l.map(l=>[l.id,l.nome]));
const bs=s=>`<span class="b s-${s}"><i aria-hidden="true" data-lucide="${SI[s]}"></i>${S[s]}</span>`;
const bp=p=>`<span class="b p-${p}"><i aria-hidden="true" data-lucide="${PI[p]}"></i>${P[p]}</span>`;
const opts=(o,sel,all)=>(all?`<option value="">${all}</option>`:'')+Object.entries(o).map(([k,v])=>`<option value="${esc(k)}"${k==sel?' selected':''}>${esc(v)}</option>`).join('');
const it=(k,v)=>`<div><span class="mu">${k}</span><br>${v}</div>`;

function vPainel(){
 const at=db.c.filter(open).filter(c=>c.prio>=3).sort((x,y)=>y.prio-x.prio||dias(y)-dias(x));
 const n=s=>db.c.filter(c=>s.includes(c.st)).length;
 const custo=db.k.reduce((s,k)=>s+k.q*k.v,0);
 return `<div class="page-intro"><span class="eyebrow">GESTÃO E APOIO / 11</span><h1>${admin()?'Painel de manutenção':'Meus pedidos de manutenção'}</h1><p>${admin()?'Acompanhe os pedidos dos espaços e equipamentos da escola.':'Abra um pedido e acompanhe cada etapa até a conclusão.'}</p></div>
 <h2>${admin()?'Exigem atenção':'Meus pedidos prioritários'}</h2>
 ${at.length?`<ul class="at">${at.map(c=>`<li class="pr${c.prio}"><div><a href="#/chamado/${c.id}">${esc(c.titulo)}</a><br><span class="mu">${loc(c)}, aberto há ${dias(c)} dia(s)</span></div><span>${bp(c.prio)} ${bs(c.st)}</span><span>${esc(c.resp)||'Sem responsável'}</span></li>`).join('')}</ul>`:'<p>Nenhum chamado de prioridade alta ou urgente em aberto.</p>'}
 <h2>Visão geral</h2>
 <div class="st"><div><b>${n('a')}</b>Aguardando início</div><div><b>${n('pm')}</b>Em andamento</div><div><b>${n('c')}</b>Concluídos</div>${admin()?`<div><b>${brl(custo)}</b>Custo registrado</div>`:''}</div>
 <p><a class="btn" href="#/${admin()?'chamados':'novo'}"><i aria-hidden="true" data-lucide="${admin()?'clipboard-list':'plus'}"></i>${admin()?'Ver todos os chamados':'Abrir novo pedido'}</a></p>`;
}

let F={s:'',p:'',l:''};
function rows(){
 const r=db.c.filter(c=>(!F.s||c.st===F.s)&&(!F.p||c.prio==F.p)&&(!F.l||c.localId==F.l)).sort((a,b)=>b.id-a.id);
 return r.length?r.map(c=>`<tr><td data-l="Nº">#${c.id}</td><td data-l="Chamado"><a href="#/chamado/${c.id}"><b>${esc(c.titulo)}</b></a><br><span class="mu">${loc(c)}</span></td><td data-l="Prioridade">${bp(c.prio)}</td><td data-l="Situação">${bs(c.st)}</td><td data-l="Responsável">${esc(c.resp)||'—'}</td><td data-l="Aberto em">${dt(c.aberto)}</td></tr>`).join(''):'<tr><td colspan="6">Nenhum chamado com esses filtros.</td></tr>';
}
function vLista(){
 return `<div class="page-intro"><span class="eyebrow">${admin()?'ADMINISTRAÇÃO':'ÁREA DO ALUNO'}</span><h1>${admin()?'Chamados':'Meus chamados'}</h1><p>${admin()?'Filtre e acompanhe todos os pedidos de manutenção.':'Veja a situação e o histórico dos pedidos feitos na sua conta.'}</p></div><div class="filter-panel row"><div><label for="fs">Situação</label><select id="fs" data-flt="s">${opts(S,F.s,'Todas')}</select></div><div><label for="fp">Prioridade</label><select id="fp" data-flt="p">${opts(P,F.p,'Todas')}</select></div><div><label for="fl">Local</label><select id="fl" data-flt="l">${opts(lo(),F.l,'Todos')}</select></div></div>
 <div class="table-shell"><table class="rt"><thead><tr><th>Nº</th><th>Chamado</th><th>Prioridade</th><th>Situação</th><th>Responsável</th><th>Aberto em</th></tr></thead><tbody id="rows">${rows()}</tbody></table></div>`;
}

function vNovo(){
 return `<div class="page-intro"><span class="eyebrow">PEDIDO DE MANUTENÇÃO</span><h1>Novo chamado</h1><p>Descreva o problema e escolha onde ele acontece.</p></div><form class="card" data-f="novo">
 <label for="l">Local</label><select id="l" name="l" required>${opts(lo(),'','Escolha o local')}</select>
 <label for="e">Equipamento (opcional)</label><select id="e" name="e"><option value="">Não se aplica</option></select>
 <label for="t">O que precisa de conserto</label><input id="t" name="t" required maxlength="80">
 <label for="d">Descrição do problema</label><textarea id="d" name="d" required></textarea>
 <div class="row"><div><label for="p">Prioridade</label><select id="p" name="p">${opts(P,2)}</select></div><div><span class="field-label">Solicitante</span><p class="readonly">${esc(user.name)}</p></div></div><p class="err" role="alert"></p>
 <button class="btn"><i aria-hidden="true" data-lucide="plus"></i>Abrir chamado</button></form>`;
}

function vChamado(id){
 const c=by(db.c,id);
 if(!c)return '<h1>Chamado não encontrado</h1><p><a href="#/chamados">Voltar para a lista</a></p>';
 const e=by(db.e,c.equipId),an=db.a.filter(a=>a.chId===id).sort((x,y)=>y.id-x.id),cu=db.k.filter(k=>k.chId===id),fechado=c.st==='c'||c.st==='x';
 return `<div class="ticket-head"><a class="back-link" href="#/chamados"><i aria-hidden="true" data-lucide="arrow-left"></i>Voltar para os chamados</a><span class="eyebrow">CHAMADO / ${String(id).padStart(3,'0')}</span><h1>${esc(c.titulo)}</h1><p>${bs(c.st)} ${bp(c.prio)}</p></div>
 <section class="card"><div class="row">${it('Local',loc(c))}${it('Equipamento',e?esc(e.nome):'—')}${it('Pedido por',esc(c.sol))}${it('Responsável',esc(c.resp)||'Sem responsável')}${it('Aberto em',dt(c.aberto))}${c.st==='c'?it('Concluído em',dt(c.concl)):''}</div>
 <p>${esc(c.desc)}</p>${c.serv?`<p><b>Serviço realizado:</b> ${esc(c.serv)}</p>`:''}</section>
 ${admin()?`<section class="card"><h2>Atualizar situação</h2>
 ${fechado?`<p class="mu">Este chamado está ${c.st==='c'?'concluído':'cancelado'} e não pode mais ser alterado.</p>`:`<form data-f="sit" data-id="${id}" novalidate>
 <div class="row"><div><label for="st">Nova situação</label><select id="st" name="st">${opts(S,c.st)}</select></div>
 <div><label for="rp">Responsável</label><select id="rp" name="resp"><option value="">Sem responsável</option>${EQ.map(x=>`<option${x===c.resp?' selected':''}>${x}</option>`).join('')}</select></div>
 <div><label for="por">Registrado por</label><input id="por" name="por" placeholder="Seu nome"></div></div>
 <label for="ob">Observação</label><textarea id="ob" name="obs"></textarea>
 <fieldset id="cf" hidden><legend>Dados da conclusão</legend>
 <label for="dc">Data de conclusão</label><input id="dc" type="date" name="dc" value="${hoje()}" min="${c.aberto}" aria-describedby="er">
 <label for="sv">Descrição do serviço realizado</label><textarea id="sv" name="serv" aria-describedby="er"></textarea></fieldset>
 <p class="err" id="er" role="alert"></p><button class="btn"><i aria-hidden="true" data-lucide="check"></i>Registrar andamento</button></form>`}</section>`:''}
 <section class="card"><h2>Histórico</h2><ol class="tl">${an.map(a=>`<li>${bs(a.st)} <span class="mu">${dt(a.quando)} às ${a.quando.slice(11)}, ${esc(a.por)}</span><br>${esc(a.obs)}</li>`).join('')}</ol></section>
 ${admin()?`<section class="card"><h2>Materiais e serviços</h2>
 ${cu.length?`<table class="rt"><thead><tr><th>Tipo</th><th>Descrição</th><th class="n">Qtd.</th><th class="n">Unitário</th><th class="n">Total</th></tr></thead><tbody>${cu.map(k=>`<tr><td data-l="Tipo">${k.tipo}</td><td data-l="Descrição">${esc(k.desc)}</td><td class="n" data-l="Qtd.">${k.q}</td><td class="n" data-l="Unitário">${brl(k.v)}</td><td class="n" data-l="Total">${brl(k.q*k.v)}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="4">Custo do chamado</th><th class="n">${brl(tot(id))}</th></tr></tfoot></table>`:'<p class="mu">Nenhum custo registrado ainda.</p>'}
 <form data-f="custo" data-id="${id}"><div class="row"><div><label for="ct">Tipo</label><select id="ct" name="tipo"><option>Material</option><option>Serviço</option></select></div><div><label for="cd">Descrição</label><input id="cd" name="desc" required></div><div><label for="cq">Quantidade</label><input id="cq" name="q" type="number" min="0.01" step="any" value="1" required></div><div><label for="cv">Valor unitário (R$)</label><input id="cv" name="v" type="number" min="0" step="0.01" required></div></div>
 <button class="btn"><i aria-hidden="true" data-lucide="plus"></i>Adicionar custo</button></form></section>`:''}`;
}

function vLocais(){
 return `<div class="page-intro"><span class="eyebrow">ADMINISTRAÇÃO / CADASTROS</span><h1>Locais e equipamentos</h1><p>Organize os espaços da escola e os equipamentos vinculados a cada local.</p></div>
 <div class="location-grid">${db.l.map(l=>{const eq=db.e.filter(e=>e.localId===l.id),n=db.c.filter(c=>c.localId===l.id&&open(c)).length;return `<section class="card location-card"><span class="eyebrow">${esc(l.tipo)}</span><h2>${esc(l.nome)}</h2><p class="open-count">${n} chamado${n===1?'':'s'} em aberto</p>${eq.length?`<ul class="equipment-list">${eq.map(e=>`<li><i aria-hidden="true" data-lucide="wrench"></i><span>${esc(e.nome)}<small>${esc(e.pat)||'Sem patrimônio'}</small></span></li>`).join('')}</ul>`:'<p class="mu">Nenhum equipamento cadastrado.</p>'}</section>`}).join('')}</div>
 <h2 class="section-title">Novos cadastros</h2><div class="row"><form class="card" data-f="local"><span class="eyebrow">ESPAÇO DA ESCOLA</span><h2>Cadastrar local</h2><label for="ln">Nome</label><input id="ln" name="nome" required><label for="lt">Tipo</label><select id="lt" name="tipo">${opts(arr(TL))}</select><button class="btn"><i aria-hidden="true" data-lucide="plus"></i>Cadastrar local</button></form>
 <form class="card" data-f="equip"><span class="eyebrow">PATRIMÔNIO E EQUIPAMENTOS</span><h2>Cadastrar equipamento</h2><label for="el">Local</label><select id="el" name="l" required>${opts(lo())}</select><label for="en">Nome</label><input id="en" name="nome" required><label for="ep">Código de patrimônio</label><input id="ep" name="pat"><button class="btn"><i aria-hidden="true" data-lucide="plus"></i>Cadastrar equipamento</button></form></div>`;
}

let R={de:'',ate:''};
function relBody(){
 const cs=db.c.filter(c=>(!R.de||c.aberto>=R.de)&&(!R.ate||c.aberto<=R.ate));
 const lin=db.l.map(l=>{const x=cs.filter(c=>c.localId===l.id);return{n:l.nome,ab:x.filter(open).length,co:x.filter(c=>c.st==='c').length,cu:x.reduce((s,c)=>s+tot(c.id),0)}}).filter(r=>r.ab+r.co+r.cu);
 const mx=Math.max(1,...lin.map(r=>r.cu)),T=k=>lin.reduce((s,r)=>s+r[k],0);
 return lin.length?`<table class="rt"><thead><tr><th>Local</th><th class="n">Abertos</th><th class="n">Concluídos</th><th class="n">Custo</th><th class="bc"></th></tr></thead><tbody>${lin.map(r=>`<tr><td data-l="Local">${esc(r.n)}</td><td class="n" data-l="Abertos">${r.ab}</td><td class="n" data-l="Concluídos">${r.co}</td><td class="n" data-l="Custo">${brl(r.cu)}</td><td class="bc" aria-hidden="true"><div class="bar"><i style="width:${r.cu/mx*100}%"></i></div></td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><th class="n" data-l="Abertos">${T('ab')}</th><th class="n" data-l="Concluídos">${T('co')}</th><th class="n" data-l="Custo">${brl(T('cu'))}</th><th class="bc"></th></tr></tfoot></table>`:'<p>Nenhum chamado no período.</p>';
}
function vRel(){
 return `<div class="page-intro"><span class="eyebrow">ADMINISTRAÇÃO / CONSULTA</span><h1>Relatório por local</h1><p>Chamados abertos, concluídos e custos, filtrados pela data de abertura.</p></div><div class="filter-panel row"><div><label for="de">De</label><input id="de" type="date" data-rel="de" value="${R.de}"></div><div><label for="ate">Até</label><input id="ate" type="date" data-rel="ate" value="${R.ate}"></div></div><div id="rb" class="table-shell">${relBody()}</div>`;
}

function inviteDate(s){return new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
function inviteStatus(i){return i.usedAt?'Usado':new Date(i.expiresAt)<=new Date()?'Expirado':'Ativo'}
function inviteLink(token){return `${location.origin}${location.pathname}#/convite/${encodeURIComponent(token)}`}
function vConvites(){
 const invites=db.i||[];
 return `<div class="page-intro"><span class="eyebrow">ADMINISTRAÇÃO / ACESSOS</span><h1>Convites de administrador</h1><p>Gere um link de uso único para outra pessoa criar uma conta administrativa.</p></div>
 ${lastInviteUrl?`<section class="card invite-result" role="status"><span class="eyebrow">CONVITE GERADO</span><h2>Envie este link ao administrador</h2><p class="mu">Ele expira em 72 horas e só pode ser usado uma vez.</p><div class="copy-row"><input id="invite-link" readonly value="${esc(lastInviteUrl)}" aria-label="Link do convite"><button type="button" class="btn" data-copy="#invite-link"><i aria-hidden="true" data-lucide="copy"></i>Copiar link</button></div></section>`:''}
 <div class="row"><form class="card" data-f="invite"><span class="eyebrow">NOVO ACESSO</span><h2>Convidar administrador</h2><label for="ie">E-mail institucional</label><input id="ie" name="email" type="email" autocomplete="email" required><p class="mu">O e-mail ficará vinculado à conta criada pelo convite.</p><p class="err" role="alert"></p><button class="btn"><i aria-hidden="true" data-lucide="user-plus"></i>Gerar convite</button></form>
 <section class="card"><span class="eyebrow">CONTROLE</span><h2>Convites emitidos</h2>${invites.length?`<table class="rt invite-table"><thead><tr><th>E-mail</th><th>Status</th><th>Expira em</th></tr></thead><tbody>${invites.map(i=>`<tr><td data-l="E-mail">${esc(i.email)}</td><td data-l="Status"><span class="b ${inviteStatus(i)==='Ativo'?'s-p':'s-x'}">${inviteStatus(i)}</span></td><td data-l="Expira em">${inviteDate(i.expiresAt)}</td></tr>`).join('')}</tbody></table>`:'<p class="mu">Nenhum convite emitido.</p>'}</section></div>`;
}

function vInvite(info,token){
 return `<div class="auth-layout"><div class="auth-note"><span class="eyebrow">ACESSO ADMINISTRATIVO / ETEC ORLANDO QUAGLIATO</span><h1>Convite para cuidar da escola.</h1><p>Este link foi criado por um administrador. Defina seus dados para entrar na área de gestão e apoio.</p><div class="auth-steps"><span>01 · Confirme seu nome</span><span>02 · Crie uma senha</span><span>03 · Acesse o painel</span></div></div>
 <form class="card auth-card" data-f="accept_invite" data-token="${esc(token)}"><span class="eyebrow">CONVITE VÁLIDO</span><h2>Criar acesso administrativo</h2><span class="field-label">E-mail convidado</span><p class="readonly">${esc(info.email)}</p><label for="in">Nome</label><input id="in" name="name" autocomplete="name" required maxlength="100"><label for="ip">Senha</label><input id="ip" name="password" type="password" autocomplete="new-password" minlength="12" required><p class="mu">Use pelo menos 12 caracteres.</p><p class="err" role="alert"></p><button class="btn" type="submit">Criar acesso<i aria-hidden="true" data-lucide="arrow-right"></i></button></form></div>`;
}

function validar(c,st,dc,sv){
 if(st!=='c')return '';
 if(!dc||!String(sv).trim())return 'Para concluir, informe a data de conclusão e descreva o serviço realizado.';
 if(dc<c.aberto)return 'A data de conclusão não pode ser anterior à abertura do chamado.';
 return '';
}
function vAuth(register){
 return `<div class="auth-layout"><div class="auth-note"><span class="eyebrow">ETEC ORLANDO QUAGLIATO / 11</span><h1>Um pedido acompanhado do início ao fim.</h1><p>Manutenção de instalações, espaços e equipamentos da escola. Alunos registram e acompanham pedidos; a equipe administrativa organiza a execução.</p><div class="auth-steps"><span>01 · Abra o chamado</span><span>02 · Acompanhe o andamento</span><span>03 · Consulte a conclusão</span></div></div>
 <form class="card auth-card" data-f="${register?'register':'login'}"><span class="eyebrow">${register?'ÁREA DO ALUNO':'ACESSO AO SISTEMA'}</span><h2>${register?'Criar conta de aluno':'Entrar na sua conta'}</h2>
 ${register?'<label for="name">Nome</label><input id="name" name="name" autocomplete="name" required maxlength="100">':''}
 <label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="email" required>
 <label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="${register?'new-password':'current-password'}" required ${register?'minlength="12"':''}>
 ${register?'<p class="mu">Use pelo menos 12 caracteres.</p>':''}<p class="err" role="alert"></p>
 <button class="btn" type="submit">${register?'Criar conta':'Entrar'}<i aria-hidden="true" data-lucide="arrow-right"></i></button>
 <p>${register?'Já tem uma conta? <a href="#/entrar">Entrar</a>':'É aluno e ainda não tem conta? <a href="#/cadastro">Criar conta</a>'}</p></form></div>`;
}

async function submitForm(f){
 const action=f.dataset.f,v=Object.fromEntries(new FormData(f));
 if(action==='sit'){
  const c=by(db.c,+f.dataset.id),er=validar(c,v.st,v.dc,v.serv||'');
  if(er){$('#er').textContent=er;$(!v.dc?'#dc':!(v.serv||'').trim()?'#sv':'#dc').focus();return}
 }
 const button=$('button[type="submit"],button.btn',f);
 if(button)button.disabled=true;
 try{
  const result=await api(action,{...v,token:f.dataset.token,id:f.dataset.id?+f.dataset.id:undefined});
  if(action==='login'||action==='register'||action==='accept_invite'){
   user=result.user;csrf=result.csrf;db=result.db;
   location.hash='#/painel';route(true);return;
  }
  if(action==='invite'){
   lastInviteUrl=inviteLink(result.token);
   await load();route(true);return;
  }
  await load();
  if(action==='novo')location.hash='#/chamado/'+result.id;
  route(true);
 }catch(error){
  const target=$('.err',f);
  if(target)target.textContent=error.message;
  else {let p=document.createElement('p');p.className='err';p.setAttribute('role','alert');p.textContent=error.message;f.prepend(p)}
  if(button)button.disabled=false;
 }
}

async function route(foco){
 const p=location.hash.split('/'),r=p[1]||'painel';
 themeButton();
 $('#nav').hidden=!user;
 $('#nav').classList.remove('is-open');$('#menu-toggle').hidden=!user;$('#menu-toggle').setAttribute('aria-expanded','false');
 $('#account').innerHTML=user?`<span>${esc(user.name)} <small>· ${admin()?'Administração':'Aluno'}</small></span><button type="button" class="lk" data-logout>Sair</button>`:'';
 document.querySelectorAll('#nav [data-admin]').forEach(a=>a.hidden=!admin());
 if(r==='convite'){
  const token=decodeURIComponent(p.slice(2).join('/'));
  $('#app').innerHTML=token?'<div class="card"><p>Validando o convite...</p></div>':'<div class="card"><h1>Convite inválido</h1><p>O link não contém um convite válido.</p></div>';
  if(token){
   try{const result=await api('invite_info',{token});$('#app').innerHTML=vInvite(result.invite,token)}
   catch(error){$('#app').innerHTML=`<div class="card"><h1>Convite indisponível</h1><p class="err">${esc(error.message)}</p><p><a href="#/entrar">Voltar para o acesso</a></p></div>`}
  }
 } else if(!user)$('#app').innerHTML=vAuth(r==='cadastro');
 else {
  const V={painel:vPainel,chamados:vLista,chamado:()=>vChamado(+p[2]),novo:vNovo,locais:vLocais,relatorio:vRel,convites:vConvites};
  $('#app').innerHTML=(V[r]&&(!['locais','relatorio'].includes(r)||admin())?V[r]:vPainel)();
 }
 document.querySelectorAll('#nav a').forEach(a=>{a.dataset.r===(r==='chamado'?'chamados':r)?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
 icons();
 if(foco){window.scrollTo(0,0);const h=$('#app h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}
}
document.addEventListener('submit',e=>{const f=e.target;if(!f.dataset.f)return;e.preventDefault();submitForm(f)});
document.addEventListener('click',async e=>{
 if(e.target.closest('#menu-toggle')){const opened=$('#nav').classList.toggle('is-open');$('#menu-toggle').setAttribute('aria-expanded',String(opened));return}
 if(e.target.closest('#theme-toggle')){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('etec-theme',next)}catch(_){}themeButton();icons();return}
 const copy=e.target.closest('[data-copy]');
 if(copy){const input=$(copy.dataset.copy);if(!input)return;try{await navigator.clipboard.writeText(input.value);copy.innerHTML='<i aria-hidden="true" data-lucide="check"></i>Copiado';icons()}catch(_){input.focus();input.select()}return}
 if(!e.target.closest('[data-logout]'))return;
 try{await api('logout');await load();location.hash='#/entrar';route(true)}catch(error){alert(error.message)}
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.dataset.flt){F[t.dataset.flt]=t.value;$('#rows').innerHTML=rows();icons()}
 else if(t.id==='st')$('#cf').hidden=t.value!=='c';
 else if(t.id==='l'&&t.form&&t.form.dataset.f==='novo')$('#e').innerHTML='<option value="">Não se aplica</option>'+db.e.filter(x=>x.localId==t.value).map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join('');
 else if(t.dataset.rel){R[t.dataset.rel]=t.value;$('#rb').innerHTML=relBody()}
});
addEventListener('hashchange',()=>route(true));
load().then(()=>route()).catch(error=>{$('#app').innerHTML=`<div class="card"><h1>Não foi possível abrir o sistema</h1><p class="err">${esc(error.message)}</p></div>`});
