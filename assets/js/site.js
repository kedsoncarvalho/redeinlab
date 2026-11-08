/* Rede INLAB+ — site.js v3 (Home + Vacinas). Sem dependências. Dados em assets/data/catalogo.js */
(function(){
  "use strict";
  var D = window.INLAB || {};
  var $ = function(s,c){return (c||document).querySelector(s)};
  var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var WA = (D.contato && D.contato.whatsapp) || "5577998535133";
  var MAIN = document.querySelector("main");
  var PAGE = MAIN && MAIN.dataset.page || "home";

  function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function money(n){
    var cents = Math.round(n*100)%100 !== 0;
    return "R$ " + n.toLocaleString("pt-BR",{minimumFractionDigits:cents?2:0,maximumFractionDigits:2});
  }
  function inst(p){var v=p.preco/p.parcelas;return p.parcelas+"x de "+money(Math.round(v*100)/100)}
  function waLink(msg){return "https://wa.me/"+WA+"?text="+encodeURIComponent(msg)}
  var ICO = function(id,cls){return '<svg class="ico'+(cls?" "+cls:"")+'"><use href="#i-'+id+'"/></svg>'};

  /* ---------- WhatsApp e resultados */
  function bindWa(root){
    $$("[data-wa]",root).forEach(function(a){
      if(a.dataset.waBound) return; a.dataset.waBound=1;
      a.href = waLink(a.getAttribute("data-wa")); a.target="_blank"; a.rel="noopener";
    });
  }
  bindWa();
  document.addEventListener("click",function(e){
    var r = e.target.closest("[data-results]");
    if(r && (r.getAttribute("href")||"").charAt(0)==="#"){ e.preventDefault(); closeAll(); toast("O portal de resultados será ligado aqui na versão final.",false); }
  });

  /* ---------- aviso */
  var tEl=$("[data-toast]"), tTimer;
  function toast(msg,withCart){
    if(!tEl) return;
    $("[data-toast-t]",tEl).textContent=msg;
    $("button",tEl).style.display = withCart===false ? "none" : "";
    tEl.classList.add("on"); clearTimeout(tTimer);
    tTimer=setTimeout(function(){tEl.classList.remove("on")},3600);
  }

  /* ---------- topo: transparente sobre a capa */
  var header=$("[data-header]");
  if(header && !header.classList.contains("solid")){
    var onScroll=function(){header.classList.toggle("scrolled", window.scrollY>40)};
    onScroll(); window.addEventListener("scroll",onScroll,{passive:true});
  }

  /* ---------- catálogo */
  var P={};
  (D.pacotes||[]).forEach(function(p){P[p.id]=p});
  (D.avulsas||[]).forEach(function(p){P[p.id]=p});
  (D.checkups||[]).forEach(function(p){P[p.id]=p});

  var FASES=[
    {id:"bebe",nome:"Bebês",faixa:"0 a 2 anos",foto:"assets/img/fases/bebes.jpg"},
    {id:"crianca",nome:"Crianças",faixa:"2 a 12 anos",foto:"assets/img/fases/criancas.jpg"},
    {id:"gestante",nome:"Gestantes",faixa:"Durante a gravidez",foto:"assets/img/fases/gestantes.jpg"},
    {id:"adulto",nome:"Adultos",faixa:"Adolescentes e adultos",foto:"assets/img/fases/adultos.jpg"},
    {id:"60mais",nome:"60+",faixa:"Saúde na maturidade",foto:"assets/img/fases/60mais.jpg"}
  ];
  var FN={};FASES.forEach(function(f){FN[f.id]=f.nome});
  function cats(p){return p.categorias || (p.categoria?[p.categoria]:[])}

  /* ---------- sacola (localStorage com fallback em memória) */
  var KEY="inlab_sacola_v3", mem=[];
  function load(){try{var v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v.filter(function(id){return P[id]}):[]}catch(e){return mem.slice()}}
  function save(a){mem=a.slice();try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  var cart=load();
  function inCart(id){return cart.indexOf(id)>-1}
  function toggle(id){
    if(!P[id]) return;
    if(inCart(id)){cart=cart.filter(function(x){return x!==id})}
    else{cart.push(id);toast(P[id].nome+" na sacola.")}
    save(cart);sync();
  }
  function addLabel(id){return inCart(id)?'<span>Na sacola</span><i>'+ICO("check")+'</i>':'<span>Comprar</span><i>'+ICO("plus")+'</i>'}
  function sync(){
    $$("[data-badge]").forEach(function(b){b.textContent=cart.length;b.classList.toggle("show",cart.length>0)});
    $$("[data-add]").forEach(function(b){
      var id=b.dataset.add, on=inCart(id);
      b.classList.toggle("on",on);
      b.setAttribute("aria-pressed",on);
      if(b.classList.contains("plus")){b.innerHTML=ICO(on?"check":"plus");b.setAttribute("aria-label",(on?"Remover ":"Comprar ")+P[id].nome)}
      else b.innerHTML=addLabel(id);
    });
    renderCart();
  }
  function itemHTML(p){return '<div class="dr-i"><img src="'+esc(p.foto)+'" alt=""><b>'+esc(p.nome)+'</b><span class="p">'+money(p.preco)+(p.provisorio?"*":"")+'</span><small>'+(p.tipo==="checkup"?p.qtd+" exames":p.tipo==="pacote"?p.vacinas+" vacinas":"Vacina avulsa")+'</small><button type="button" data-rm="'+p.id+'">Remover</button></div>'}
  var cartHooks=[];
  function renderCart(){
    cartHooks.forEach(function(f){f()});
    var box=$("[data-cart-items]"), foot=$("[data-cart-foot]");
    if(!box) return;
    if(!cart.length){
      box.innerHTML='<div class="dr-e">'+ICO("bag")+'<b>Sua sacola está vazia</b><span>Escolha vacinas ou check-ups para começar.</span><a class="btn b-red b-sm" href="vacinas.html">Ver vacinas</a></div>';
      foot.innerHTML=""; return;
    }
    var total=0;
    box.innerHTML=cart.map(function(id){
      var p=P[id]; total+=p.preco;
      return itemHTML(p);
    }).join("");
    var msg="Olá! Quero comprar pelo site da Rede INLAB+:\n"+cart.map(function(id){return "• "+P[id].nome+" ("+money(P[id].preco)+")"}).join("\n")+"\nTotal: "+money(total)+"\nPode me ajudar a finalizar e agendar?";
    foot.innerHTML='<div class="dr-t"><span>Total</span><b>'+money(total)+'</b></div>'+
      '<a class="btn ar b-red" href="sacola.html">Finalizar compra<span class="c">'+ICO("arrow")+'</span></a>'+
      '<a class="btn b-line" href="'+waLink(msg)+'" target="_blank" rel="noopener">'+ICO("wa","fill")+'Enviar pelo WhatsApp</a>'+
      (cart.some(function(id){return P[id].provisorio})?'<span class="note">* Valores de vacina provisórios.</span>':'');
  }

  /* ---------- camadas (sacola, ficha, menu) */
  var lastFocus;
  function open(el){
    if(!el) return; closeAll(true); lastFocus=lastFocus||document.activeElement;
    el.classList.add("on"); el.setAttribute("aria-hidden","false");
    $("[data-scrim]").classList.add("on"); document.body.style.overflow="hidden";
    var f=$("[data-close]",el); if(f) setTimeout(function(){f.focus()},60);
  }
  function closeAll(keep){
    $$(".drawer.on,.sheet.on,.mnav.on").forEach(function(el){el.classList.remove("on");el.setAttribute("aria-hidden","true")});
    if(keep) return;
    var s=$("[data-scrim]"); if(s) s.classList.remove("on");
    document.body.style.overflow="";
    if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true});
    lastFocus=null;
  }
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeAll()});

  document.addEventListener("click",function(e){
    var a=e.target.closest("[data-add]"); if(a){e.preventDefault();toggle(a.dataset.add);return}
    var r=e.target.closest("[data-rm]"); if(r){toggle(r.dataset.rm);return}
    if(e.target.closest("[data-checkout]")){toast("O pagamento online entra na versão WordPress (WooCommerce).",false);return}
    var o=e.target.closest("[data-open]"); if(o){e.preventDefault();openSheet(o.dataset.open);return}
    if(e.target.closest("[data-open-cart]")){e.preventDefault();if(tEl)tEl.classList.remove("on");open($("[data-drawer]"));return}
    if(e.target.closest("[data-open-menu]")){open($("[data-mnav]"));return}
    if(e.target.closest("[data-close]")||e.target.closest("[data-scrim]")){closeAll();return}
    if(e.target.closest(".mnav a.l")||e.target.closest(".dr-e a")){lastFocus=null;closeAll()}
  });

  function priceHTML(p){
    return '<div class="price">'+(p.preco_de?'<s>'+money(p.preco_de)+'</s>':'')+'<b>'+money(p.preco)+(p.provisorio?'<sup>*</sup>':'')+'</b><span>ou '+inst(p)+'</span></div>';
  }
  function openSheet(id){
    var p=P[id], sh=$("[data-sheet]"); if(!p||!sh) return;
    $("[data-sh-img]",sh).src=p.foto;
    $("[data-sh-img]",sh).style.objectPosition=""; sh.classList.remove("pro");
    $("[data-sh-tag]",sh).textContent = p.tipo==="pacote" ? "Pacote · "+p.vacinas+" vacinas" : p.tipo==="checkup" ? "Check-up · "+p.qtd+" exames" : "Vacina avulsa";
    $("[data-sh-title]",sh).textContent=p.nome;
    $("[data-sh-desc]",sh).textContent = p.publico || p.descricao || "";
    var body="";
    if(p.tipo==="pacote") body=(p.composicao||[]).map(function(c){return '<div class="tl"><b>'+esc(c.quando)+'</b><span>'+c.vacinas.map(esc).join(" · ")+'</span></div>'}).join("");
    else if(p.tipo==="checkup") body='<ul>'+(p.exames||[]).map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+'</ul>';
    else body='<div class="tl"><b>Indicação</b><span>'+cats(p).map(function(c){return FN[c]}).join(" · ")+'</span></div><div class="tl"><b>Aplicação</b><span>Nas unidades INLAB+ ou em casa com o INLAB+ Móvel.</span></div>';
    $("[data-sh-body]",sh).innerHTML=body;
    $("[data-sh-foot]",sh).innerHTML=priceHTML(p)+'<button class="add" type="button" data-add="'+id+'">'+addLabel(id)+'</button>';
    open(sh); sync();
  }
  function cardHTML(p){
    var fases=esc(cats(p).map(function(c){return FN[c]}).join(" · "));
    var tag = p.tipo==="pacote" ? fases : "Avulsa · "+fases;
    var n = p.tipo==="pacote" ? '<span class="n">'+p.vacinas+' vacinas</span>' : '';
    return '<article class="card"><button class="ph" type="button" data-open="'+p.id+'" aria-label="Ver detalhes de '+esc(p.nome)+'"><img src="'+esc(p.foto)+'" alt="" loading="lazy"><span class="tag">'+tag+'</span>'+n+'</button>'+
      '<div class="bd"><h3>'+esc(p.nome)+'</h3><p class="d">'+esc(p.publico||p.descricao)+'</p>'+
      '<div class="ft">'+priceHTML(p)+'<button class="add" type="button" data-add="'+p.id+'">'+addLabel(p.id)+'</button></div></div></article>';
  }

  /* ---------- trilhos com setas */
  function bindRails(){
    $$("[data-rnav]").forEach(function(nav){
      var rail=document.getElementById(nav.dataset.rnav); if(!rail) return;
      var btns=$$("button",nav);
      var upd=function(){btns[0].disabled=rail.scrollLeft<8;btns[1].disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-8};
      btns.forEach(function(b){b.addEventListener("click",function(){rail.scrollBy({left:(+b.dataset.dir)*rail.clientWidth*.9,behavior:"smooth"})})});
      rail.addEventListener("scroll",upd,{passive:true}); window.addEventListener("resize",upd); upd();
    });
  }

  /* ---------- horários (Barreiras, UTC-3) */
  function nowBRT(){var d=new Date(Date.now()-3*3600e3);return {dow:d.getUTCDay(),min:d.getUTCHours()*60+d.getUTCMinutes()}}
  function hhmm(m){var h=Math.floor(m/60),mm=m%60;return h+"h"+(mm?String(mm).padStart(2,"0"):"")}
  function status(u){
    var n=nowBRT(), slots = n.dow===0?[]:(n.dow===6?u.sabado:u.semana)||[];
    for(var i=0;i<slots.length;i++){ if(n.min>=slots[i][0]&&n.min<slots[i][1]) return {open:true,ate:hhmm(slots[i][1])} }
    return {open:false};
  }

  /* ================= HOME ================= */
  if(PAGE==="home"){
    var mz=(D.unidades||[]).filter(function(u){return u.id==="matriz"})[0];
    var now=$("[data-now]");
    if(mz&&now){var s0=status(mz); if(s0.open) now.innerHTML='<i></i>Matriz aberta agora · até '+s0.ate;}

    var ages=$("[data-ages]");
    if(ages) ages.innerHTML=FASES.map(function(f){
      return '<a class="age" href="vacinas.html#'+f.id+'"><img src="'+f.foto+'" alt="" loading="lazy"><b>'+f.nome+'</b><small>'+f.faixa+'</small><span class="see">Ver vacinas<i>'+ICO("arrow")+'</i></span></a>';
    }).join("");

    var packs=$("[data-packs]");
    if(packs) packs.innerHTML=(D.pacotes||[]).slice().sort(function(a,b){return (b.destaque?1:0)-(a.destaque?1:0)}).map(cardHTML).join("");

    var ck=$("[data-ck]");
    if(ck) ck.innerHTML=(D.checkups||[]).map(function(c){
      return '<article class="ck"><img src="'+esc(c.foto)+'" alt="" loading="lazy"><button class="open" type="button" data-open="'+c.id+'" aria-label="Ver exames do '+esc(c.nome)+'"></button>'+
        '<span class="pc"><s>'+money(c.preco_de)+'</s>'+money(c.preco)+'</span>'+
        '<div class="row"><div><b>'+esc(c.nome.replace("Check-up ",""))+'</b><small>'+c.qtd+' exames · '+inst(c)+'</small></div><button class="plus" type="button" data-add="'+c.id+'"></button></div></article>';
    }).join("");

    /* serviços */
    var cap=$("[data-svc-cap]");
    $$("[data-svc]").forEach(function(b){
      b.addEventListener("click",function(){
        $$("[data-svc]").forEach(function(x){x.setAttribute("aria-selected",x===b)});
        $$("[data-svc-img]").forEach(function(im){im.classList.toggle("on",im.dataset.svcImg===b.dataset.svc)});
        if(cap) cap.textContent=b.dataset.cap;
        if(window.innerWidth<=900) setTimeout(function(){var r=b.getBoundingClientRect();if(r.top<80||r.top>window.innerHeight*.6)window.scrollBy({top:r.top-96,behavior:"smooth"})},420);
      });
    });

    /* profissionais */
    var pros=$("[data-pros]"), pf=$("[data-pro-f]"), PR=D.profissionais||[];
    var renderPros=function(esp){
      pros.innerHTML=PR.filter(function(p){return !esp||p.especialidade===esp}).map(function(p){
        return '<article class="pro"><div class="ph"><img src="'+esc(p.foto)+'" alt="'+esc(p.nome)+'" loading="lazy"><span class="sp">'+esc(p.especialidade)+'</span><a class="ag" href="'+waLink("Olá! Gostaria de agendar uma consulta com "+p.nome+" ("+p.especialidade+").")+'" target="_blank" rel="noopener" aria-label="Agendar com '+esc(p.nome)+'">'+ICO("arrow")+'</a></div><div><b>'+esc(p.nome)+'</b><small>'+esc(p.registro||"")+'</small></div></article>';
      }).join("");
      pros.scrollLeft=0; pros.dispatchEvent(new Event("scroll"));
    };
    if(pros){
      var esps=[];PR.forEach(function(p){if(esps.indexOf(p.especialidade)<0)esps.push(p.especialidade)});
      pf.innerHTML='<button class="chip" type="button" aria-pressed="true" data-esp="">Todas</button>'+esps.map(function(e){return '<button class="chip" type="button" aria-pressed="false" data-esp="'+esc(e)+'">'+esc(e)+'</button>'}).join("");
      pf.addEventListener("click",function(e){var b=e.target.closest("[data-esp]");if(!b)return;$$("[data-esp]",pf).forEach(function(x){x.setAttribute("aria-pressed",x===b)});renderPros(b.dataset.esp)});
      renderPros("");
    }

    /* unidades */
    var sel=$("[data-city]"), list=$("[data-units]"), media=$("[data-u-media]"), partners=$("[data-partners]"), U=D.unidades||[];
    var showUnit=function(u){
      var st=status(u), maps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("INLAB "+u.endereco+", "+u.cidade+" BA");
      media.innerHTML='<img src="'+esc(u.foto)+'" alt="Fachada da unidade '+esc(u.nome)+'">'+
        '<div class="u-card"><span class="status '+(st.open?"open":"closed")+'">'+(st.open?"Aberto até "+st.ate:"Fechado agora")+'</span><h3>'+esc(u.nome)+'</h3>'+
        '<div class="row">'+ICO("pin")+'<span>'+esc(u.endereco)+(u.referencia?" · "+esc(u.referencia):"")+'</span></div>'+
        '<div class="row">'+ICO("clock")+'<span>'+esc(u.horario_texto||"")+'</span></div>'+
        '<div class="go"><a class="btn b-red b-sm" href="'+maps+'" target="_blank" rel="noopener">'+ICO("nav")+'Como chegar</a>'+
        '<a class="btn b-line b-sm" data-wa="Olá! Gostaria de agendar na unidade '+esc(u.nome)+' ('+esc(u.cidade)+')." href="#">'+ICO("wa","fill")+'Agendar</a></div></div>';
      bindWa(media);
      $$("[data-u]",list).forEach(function(x){x.setAttribute("aria-selected",x.dataset.u===u.id)});
      $$("[data-acc]",list).forEach(function(x){x.classList.toggle("open",x.dataset.acc===u.id)});
    };
    var renderCity=function(c){
      var own=U.filter(function(u){return u.cidade===c && !/parceiro/i.test(u.tipo)});
      var par=U.filter(function(u){return u.cidade===c && /parceiro/i.test(u.tipo)});
      list.innerHTML=own.map(function(u){
        var st=status(u), maps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("INLAB "+u.endereco+", "+u.cidade+" BA");
        return '<div class="u-acc" data-acc="'+u.id+'"><button class="u-i" role="tab" type="button" data-u="'+u.id+'" aria-selected="false"><b>'+esc(u.nome)+'</b><span class="a">'+esc(u.tipo)+'</span><i class="c">'+ICO("arrow")+'</i></button>'+
          '<div class="u-pan"><div><img src="'+esc(u.foto)+'" alt="Fachada da unidade '+esc(u.nome)+'" loading="lazy"><div class="inf"><span class="status '+(st.open?"open":"closed")+'">'+(st.open?"Aberto até "+st.ate:"Fechado agora")+'</span>'+
          '<div class="row">'+ICO("pin")+'<span>'+esc(u.endereco)+(u.referencia?" · "+esc(u.referencia):"")+'</span></div>'+
          '<div class="row">'+ICO("clock")+'<span>'+esc(u.horario_texto||"")+'</span></div>'+
          '<div class="go"><a class="btn b-red b-sm" href="'+maps+'" target="_blank" rel="noopener">'+ICO("nav")+'Como chegar</a><a class="btn b-line b-sm" data-wa="Olá! Gostaria de agendar na unidade '+esc(u.nome)+' ('+esc(u.cidade)+')." href="#">'+ICO("wa","fill")+'Agendar</a></div></div></div></div></div>';
      }).join("");
      bindWa(list);
      partners.innerHTML=par.length?'<b>Postos de coleta em parceiros:</b> '+par.map(function(u){return esc(u.nome)}).join(", ")+'.':'';
      if(own[0]) showUnit(own[0]);
    };
    if(sel){
      var cities=[];U.forEach(function(u){if(cities.indexOf(u.cidade)<0)cities.push(u.cidade)});
      sel.innerHTML=cities.map(function(c){return '<option>'+esc(c)+'</option>'}).join("");
      sel.addEventListener("change",function(){renderCity(sel.value)});
      list.addEventListener("click",function(e){var b=e.target.closest("[data-u]");if(!b)return;showUnit(U.filter(function(u){return u.id===b.dataset.u})[0]);
        if(window.innerWidth<=900) setTimeout(function(){var r=b.getBoundingClientRect();if(r.top<80||r.top>window.innerHeight*.6)window.scrollBy({top:r.top-96,behavior:"smooth"})},420)});
      renderCity(cities[0]);
    }

    /* campanhas */
    var camp=$("[data-camp]");
    if(camp){
      var track=$(".camp-track",camp), slides=Array.prototype.slice.call(track.children), dots=$("[data-dots]",camp), idx=0, timer;
      dots.innerHTML=slides.map(function(_,i){return '<button type="button" aria-label="Campanha '+(i+1)+'"></button>'}).join("");
      var go=function(i){idx=(i+slides.length)%slides.length;track.style.transform="translateX(-"+idx*100+"%)";$$("button",dots).forEach(function(d,j){d.setAttribute("aria-current",j===idx)})};
      dots.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;go($$("button",dots).indexOf(b));clearInterval(timer)});
      go(0); timer=setInterval(function(){go(idx+1)},6000);
      var x0=null;
      camp.addEventListener("touchstart",function(e){x0=e.touches[0].clientX},{passive:true});
      camp.addEventListener("touchend",function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40){go(idx+(dx<0?1:-1));clearInterval(timer)}x0=null});
    }
  }

  /* ================= VACINAS ================= */
  if(PAGE==="vacinas"){
    var grid=$("[data-grid]"), count=$("[data-count]"), fz=$("[data-f-fase]"), seg=$("[data-f-tipo]");
    var ALL=(D.pacotes||[]).concat(D.avulsas||[]);
    var st={fase:"todas",tipo:"todos"};
    fz.innerHTML='<button class="chip no-img" type="button" data-fase="todas" aria-pressed="true">Todas</button>'+FASES.map(function(f){return '<button class="chip" type="button" data-fase="'+f.id+'" aria-pressed="false"><img src="'+f.foto+'" alt="">'+f.nome+'</button>'}).join("");
    var render=function(){
      $$("[data-fase]",fz).forEach(function(b){b.setAttribute("aria-pressed",b.dataset.fase===st.fase)});
      $$("[data-tipo]",seg).forEach(function(b){b.setAttribute("aria-pressed",b.dataset.tipo===st.tipo)});
      var items=ALL.filter(function(p){return (st.fase==="todas"||cats(p).indexOf(st.fase)>-1)&&(st.tipo==="todos"||p.tipo===st.tipo)});
      var np=items.filter(function(p){return p.tipo==="pacote"}).length, na=items.length-np;
      count.textContent=items.length?(np?np+(np>1?" pacotes":" pacote"):"")+(np&&na?" e ":"")+(na?na+(na>1?" vacinas avulsas":" vacina avulsa"):"")+(st.fase!=="todas"?" · "+FN[st.fase]:""):"";
      grid.innerHTML=items.length?items.map(cardHTML).join(""):'<div class="empty" style="grid-column:1/-1">Nenhuma vacina neste filtro. <a href="#" data-reset>Ver todas</a></div>';
      sync();
    };
    fz.addEventListener("click",function(e){var b=e.target.closest("[data-fase]");if(!b)return;st.fase=b.dataset.fase;render();try{history.replaceState(null,"",st.fase==="todas"?location.pathname+location.search:"#"+st.fase)}catch(_){}});
    seg.addEventListener("click",function(e){var b=e.target.closest("[data-tipo]");if(!b)return;st.tipo=b.dataset.tipo;render()});
    grid.addEventListener("click",function(e){if(e.target.closest("[data-reset]")){e.preventDefault();st={fase:"todas",tipo:"todos"};render()}});
    var fromHash=function(){
      var h=decodeURIComponent((location.hash||"").slice(1));
      if(FN[h]) st.fase=h;
      if(h==="avulsas") st.tipo="avulsa";
      if(h==="pacotes") st.tipo="pacote";
      render();
    };
    window.addEventListener("hashchange",fromHash);
    fromHash();
  }

  /* ================= CONSULTAS ================= */
  function proFilters(pf,onPick){
    var PR=D.profissionais||[], esps=[];PR.forEach(function(p){if(esps.indexOf(p.especialidade)<0)esps.push(p.especialidade)});
    pf.innerHTML='<button class="chip" type="button" aria-pressed="true" data-esp="">Todas</button>'+esps.map(function(e){return '<button class="chip" type="button" aria-pressed="false" data-esp="'+esc(e)+'">'+esc(e)+'</button>'}).join("");
    pf.addEventListener("click",function(e){var b=e.target.closest("[data-esp]");if(!b)return;$$("[data-esp]",pf).forEach(function(x){x.setAttribute("aria-pressed",x===b)});onPick(b.dataset.esp)});
  }
  function openPro(id){
    var p=(D.profissionais||[]).filter(function(x){return x.id===id})[0], sh=$("[data-sheet]"); if(!p||!sh) return;
    $("[data-sh-img]",sh).src=p.foto;
    $("[data-sh-img]",sh).style.objectPosition="50% 18%"; sh.classList.add("pro");
    $("[data-sh-tag]",sh).textContent=p.especialidade;
    $("[data-sh-title]",sh).textContent=p.nome;
    $("[data-sh-desc]",sh).textContent=p.registro||"";
    var bio=p.bio?'<p class="bio">'+esc(p.bio)+'</p>':'<div class="tbd-box"><b>[conteúdo a definir]</b>Apresentação do profissional.</div>';
    var at=(p.atuacao&&p.atuacao.length)?'<h4>Áreas de atuação</h4><ul class="list-check">'+p.atuacao.map(function(a){return "<li>"+esc(a)+"</li>"}).join("")+'</ul>':'<div class="tbd-box"><b>[conteúdo a definir]</b>Áreas de atuação.</div>';
    $("[data-sh-body]",sh).innerHTML=bio+at;
    $("[data-sh-foot]",sh).innerHTML='<span class="note">Agendamento pelo WhatsApp da Matriz.</span><a class="btn ar b-red" href="'+waLink("Olá! Gostaria de agendar uma consulta com "+p.nome+" ("+p.especialidade+").")+'" target="_blank" rel="noopener">Agendar consulta<span class="c">'+ICO("arrow")+'</span></a>';
    open(sh);
  }
  document.addEventListener("click",function(e){var b=e.target.closest("[data-pro]");if(b){e.preventDefault();openPro(b.dataset.pro)}});
  if(PAGE==="consultas"){
    var pg=$("[data-pro-grid]");
    var drawPros=function(esp){
      pg.innerHTML=(D.profissionais||[]).filter(function(p){return !esp||p.especialidade===esp}).map(function(p){
        return '<article class="pro" id="'+p.id+'"><button class="ph" type="button" data-pro="'+p.id+'" style="border:0;padding:0;width:100%" aria-label="Ver perfil de '+esc(p.nome)+'"><img src="'+esc(p.foto)+'" alt="" loading="lazy"><span class="sp">'+esc(p.especialidade)+'</span></button>'+
          '<div class="row2"><div><b>'+esc(p.nome)+'</b><small>'+esc(p.registro||"")+'</small></div><button class="link" type="button" data-pro="'+p.id+'" style="border:0;background:none;padding:0;cursor:pointer" aria-label="Ver perfil"><span class="c">'+ICO("arrow")+'</span></button></div></article>';
      }).join("");
    };
    proFilters($("[data-pro-f]"),drawPros); drawPros("");
    var hp=(location.hash||"").slice(1); if(hp) setTimeout(function(){openPro(hp)},300);
  }

  /* ================= CHECK-UPS ================= */
  if(PAGE==="checkups"){
    var toc=$("[data-ck-toc]"), cl=$("[data-ck-list]"), C=D.checkups||[];
    toc.innerHTML=C.map(function(c){return '<a class="chip" href="#'+c.id+'" style="text-decoration:none;background:#fff">'+esc(c.nome.replace("Check-up ",""))+'</a>'}).join("");
    cl.innerHTML=C.map(function(c){
      return '<article class="ck-row" id="'+c.id+'"><div class="media"><img src="'+esc(c.foto)+'" alt="" loading="lazy"></div><div class="t">'+
        '<span class="eyebrow">'+c.qtd+' exames</span><h2>'+esc(c.nome)+'</h2><p>'+esc(c.descricao)+'</p>'+
        '<div class="ck-buy">'+priceHTML(c)+'<button class="add" type="button" data-add="'+c.id+'">'+addLabel(c.id)+'</button></div>'+
        '<ul class="exams">'+(c.exames||[]).map(function(x){return "<li>"+esc(x)+"</li>"}).join("")+'</ul></div></article>';
    }).join("");
  }

  /* ================= UNIDADES ================= */
  if(PAGE==="unidades"){
    var U2=D.unidades||[], gw=$("[data-u-groups]"), cf=$("[data-city-f]"), cities2=[];
    U2.forEach(function(u){if(cities2.indexOf(u.cidade)<0)cities2.push(u.cidade)});
    cf.innerHTML='<button class="chip no-img" type="button" data-c="" aria-pressed="true">Todas</button>'+cities2.map(function(c){return '<button class="chip no-img" type="button" data-c="'+esc(c)+'" aria-pressed="false">'+esc(c)+'</button>'}).join("");
    var uCard=function(u){
      var st=status(u), maps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("INLAB "+u.endereco+", "+u.cidade+" BA");
      return '<article class="u-card2" id="'+u.id+'"><div class="ph"><img src="'+esc(u.foto)+'" alt="Fachada da unidade '+esc(u.nome)+'" loading="lazy"><span class="status '+(st.open?"open":"closed")+'">'+(st.open?"Aberto até "+st.ate:"Fechado agora")+'</span></div>'+
        '<div class="bd"><span class="ty">'+esc(u.tipo)+'</span><h3>'+esc(u.nome)+'</h3>'+
        '<div class="row">'+ICO("pin")+'<span>'+esc(u.endereco)+(u.referencia?" · "+esc(u.referencia):"")+' · '+esc(u.cidade)+'</span></div>'+
        '<div class="row">'+ICO("clock")+'<span>'+esc(u.horario_texto||"")+'</span></div>'+
        '<div class="go"><a class="btn b-red b-sm" href="'+maps+'" target="_blank" rel="noopener">'+ICO("nav")+'Como chegar</a><a class="btn b-line b-sm" data-wa="Olá! Gostaria de agendar na unidade '+esc(u.nome)+' ('+esc(u.cidade)+')." href="#">'+ICO("wa","fill")+'Agendar</a></div></div></article>';
    };
    var drawU=function(c){
      var list=U2.filter(function(u){return !c||u.cidade===c}), groups=[];
      list.forEach(function(u){var g=/parceiro/i.test(u.tipo)?"Postos de coleta em parceiros · Barreiras":(u.cidade==="Barreiras"?"Barreiras":"Outras cidades");if(groups.indexOf(g)<0)groups.push(g)});
      gw.innerHTML=groups.map(function(g){
        var it=list.filter(function(u){var gg=/parceiro/i.test(u.tipo)?"Postos de coleta em parceiros · Barreiras":(u.cidade==="Barreiras"?"Barreiras":"Outras cidades");return gg===g});
        return '<div class="u-group"><h2>'+esc(g)+' <small>'+it.length+(it.length>1?" unidades":" unidade")+'</small></h2><div class="u-grid">'+it.map(uCard).join("")+'</div></div>';
      }).join("");
      bindWa(gw);
    };
    cf.addEventListener("click",function(e){var b=e.target.closest("[data-c]");if(!b)return;$$("[data-c]",cf).forEach(function(x){x.setAttribute("aria-pressed",x===b)});drawU(b.dataset.c)});
    drawU("");
  }

  /* ================= FINALIZAR COMPRA ================= */
  if(PAGE==="sacola"){
    var ci=$("[data-co-items]"), ct=$("[data-co-total]"), us=$("[data-co-units]");
    us.innerHTML=(D.unidades||[]).filter(function(u){return !/parceiro/i.test(u.tipo)}).map(function(u){return '<option>'+esc(u.nome)+' · '+esc(u.cidade)+'</option>'}).join("");
    cartHooks.push(function(){
      var t=0;cart.forEach(function(id){t+=P[id].preco});
      ci.innerHTML=cart.length?cart.map(function(id){return itemHTML(P[id])}).join(""):'<div class="dr-e" style="padding:20px 0"><b>Sua sacola está vazia</b><a class="btn b-red b-sm" href="vacinas.html">Ver vacinas</a></div>';
      ct.textContent=money(t);
    });
    $("[data-co-form]").addEventListener("submit",function(e){e.preventDefault()});
  }

  bindRails();
  sync();
})();
