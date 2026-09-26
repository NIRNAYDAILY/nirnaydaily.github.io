/* Nirnay Mitra (निर्णय मित्र): a search assistant for everything published on Nirnay Daily.
   It runs entirely in the reader's browser and only searches this site's own content. */
(function(){
  const $ = s => document.querySelector(s);
  const E = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const norm = s => String(s||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9ऀ-ॿ. ]/g," ").replace(/\s+/g," ").trim();
  const STOP = new Set("a an the of in on for to and or is are was were what which who whom how me my show find give get i want need about under with by from please any all tell search look see can you do does there this that it its some list".split(" "));
  /* Old names and everyday words mapped to what the site calls them. */
  const ALIAS = {
    "ipc":["bharatiya nyaya sanhita","indian penal code"], "penal":["bharatiya nyaya sanhita"],
    "crpc":["bharatiya nagarik suraksha sanhita","criminal procedure"], "cr.p.c":["bharatiya nagarik suraksha sanhita"],
    "evidence":["bharatiya sakshya adhiniyam","evidence"], "iea":["bharatiya sakshya adhiniyam"],
    "cpc":["civil procedure"], "posh":["sexual harassment"], "dv":["domestic violence"], "rti":["right to information"],
    "ibc":["insolvency"], "gst":["goods and services tax"], "it":["information technology"], "dpdp":["digital personal data"],
    "mv":["motor vehicles"], "ndps":["narcotic"], "uapa":["unlawful activities"], "pmla":["money laundering"],
    "rera":["real estate"], "larr":["land acquisition"], "rfctlarr":["land acquisition"], "mofa":["ownership flats"],
    "mlrc":["land revenue code"], "mrtp":["regional and town planning"], "mcoca":["organised crime"], "mhada":["housing and area development"],
    "hma":["hindu marriage"], "hsa":["hindu succession"], "sma":["special marriage"], "ni":["negotiable instruments"],
    "cheque":["negotiable instruments"], "bounce":["negotiable instruments"], "divorce":["marriage","divorce"],
    "maintenance":["maintenance"], "bail":["bail"], "privacy":["privacy","puttaswamy"], "euthanasia":["euthanasia","common cause"],
    "pf":["social security"], "epf":["social security"], "esi":["social security"], "gratuity":["social security"],
    "maternity":["social security"], "factories":["occupational safety"], "wages":["wages"], "bonus":["wages"],
    "trade":["trade"], "union":["union"], "telegraph":["telecommunications"], "sc":["supreme court"], "hc":["high court"],
    "llm":["ll.m","llm"], "judge":["judicial","civil judge","judge"], "judiciary":["judicial","judiciary","civil judge"]
  };
  const TIER_C = {central:"#9E2A2B", maharashtra:"#C2610F"};

  /* ---------- index of everything on the site ---------- */
  function buildIndex(){
    const X=[];
    const add=(o)=>{ o.nt=norm(o.t); o.nx=norm(o.x+" "+o.t+" "+(o.s||"")); X.push(o); };
    try{ (typeof actList==="function"?actList():[]).forEach(a=>add({type:"act",k:(a.tier==="maharashtra"?"Maharashtra Act":"Central Act")+(a.cat?" · "+a.cat:""),
      t:a.title, s:[a.short, typeof actNo==="function"?actNo(a):"", a.replaces?"Replaced "+a.replaces:""].filter(Boolean).join(" · "),
      x:[a.short,a.replaces,a.cat,"act bare act law statute",a.tier].join(" "), c:TIER_C[a.tier], slug:a.slug, a,
      go:()=>go("#a-"+a.slug)})); }catch(e){}
    try{ if(typeof LIB!=="undefined"&&LIB) LIB.items.forEach(j=>{ const l=(typeof L!=="undefined")?L.find(x=>x.name===j.name):null;
      add({type:"judgment",k:"Full judgment · Supreme Court",t:j.name,s:[l?(l.cit||l.no):j.citation, l?l.y:(j.date||"").slice(0,4)].filter(Boolean).join(" · "),
        x:[j.citation,(j.keys||[]).join(" "),l?l.held:"",l?THEMES[l.t]:"","judgment case full text supreme court"].join(" "),c:l?COL[l.t]:"#9E2A2B",
        go:()=>go("#j-"+j.slug)}); }); }catch(e){}
    try{ if(typeof L!=="undefined") L.forEach(l=>{ const lib=(typeof libByName==="function")?libByName(l.name):null; if(lib) return;
      add({type:"landmark",k:"Landmark · "+l.court,t:l.name,s:[l.cit||l.no,l.y].filter(Boolean).join(" · "),
        x:[l.cit,l.no,l.held,l.note,l.court,THEMES[l.t],"landmark judgment case",l.y].join(" "),c:COL[l.t],go:()=>go("#landmarks",l.name)}); }); }catch(e){}
    try{ if(typeof DIG!=="undefined"&&DIG) [DIG,...(DIG_AR||[])].forEach((d,ei)=>{ const ed=(d.edition||{}).dateShort||"";
      (d.chapters||[]).forEach(ch=>{ const route={sc:"#supreme-court",hc:"#high-courts",dc:"#district-courts"}[ch.id]; if(!route) return;
        (ch.pages||[]).forEach(p=>(p.items||[]).forEach(it=>{
          const court=ch.id==="sc"?"Supreme Court":ch.id==="hc"?"High Court of "+p.court:(it.court||"District court");
          add({type:"digest",latest:ei===0,chap:ch.id,k:court+" · "+ed,t:it.caseName&&!/not yet reported/i.test(it.caseName)?it.caseName:(it.headline||"Order"),
            s:it.headline||"",x:[it.citation,it.caseNo,it.text,it.tag,court,it.coram,"judgment order case",ch.id==="sc"?"supreme court sc":ch.id==="hc"?"high court hc":"district court sessions"].join(" "),
            c:"#2F7D4F",go:()=>go(route,it.caseName&&!/not yet reported/i.test(it.caseName)?it.caseName:it.headline)}); })); }); }); }catch(e){}
    try{ if(typeof TRI!=="undefined"&&TRI) [TRI,...(TRI_AR||[])].forEach((d,ei)=>{ const ed=(d.edition||{}).dateShort||"";
      (d.items||[]).forEach(it=>add({type:"tribunal",latest:ei===0,k:(it.bench||it.tribunal)+" · "+ed,t:it.caseName&&!/not yet reported/i.test(it.caseName)?it.caseName:(it.headline||"Order"),
        s:it.headline||"",x:[it.tribunal,it.bench,it.citation,it.caseNo,it.text,it.tag,"tribunal order"].join(" "),c:"#7B3F8C",
        go:()=>go("#tribunals",it.caseName&&!/not yet reported/i.test(it.caseName)?it.caseName:it.headline)})); }); }catch(e){}
    try{ const P=(typeof careerPool==="function")?careerPool():null; if(P) P.secs.forEach(sec=>sec.items.forEach(it=>{
      const st=careerStatus(it), dl=deadlineOf(it);
      add({type:"career",sec:sec.id,soon:st[0]==="soon",k:"Careers · "+sec.title,t:it.name,s:[it.org,st[1],dl?"last date "+new Date(dl+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""].filter(Boolean).join(" · "),
        x:[it.org,it.sector,it.eligibility,it.note,sec.title,sec.id,"career job opening vacancy internship exam admission recruitment"].join(" "),c:"#B7791F",go:()=>go("#careers",it.name)}); })); }catch(e){}
    return X;
  }

  /* ---------- navigation helpers ---------- */
  let pendingQ=null, pendingReader=null;
  function go(hash,q){
    if(isMobile()) toggle(false);
    pendingQ=q||null;
    if(location.hash===hash){ if(pendingQ!=null){ state.q=pendingQ; pendingQ=null; render(); } window.scrollTo({top:document.querySelector("nav.main").offsetTop,behavior:"smooth"}); }
    else location.hash=hash;
  }
  window.addEventListener("hashchange",()=>{ if(pendingQ!=null){ state.q=pendingQ; pendingQ=null; render(); } });
  function openInReader(hash,q,readerKey){
    pendingReader={key:readerKey,q,until:Date.now()+15000}; go(hash);
    const tick=()=>{ if(!pendingReader) return; const qi=document.getElementById("rdq");
      if(qi && typeof RS!=="undefined" && RS.slug===pendingReader.key && RS.data){ qi.value=pendingReader.q; qi.dispatchEvent(new Event("input")); pendingReader=null; return; }
      if(Date.now()<pendingReader.until) setTimeout(tick,200); else pendingReader=null; };
    setTimeout(tick,250);
  }
  const isMobile=()=>window.matchMedia("(max-width:640px)").matches;

  /* ---------- understanding the question ---------- */
  function expand(q){
    const n=norm(q); const toks=n.split(" ").filter(w=>w&&!STOP.has(w));
    const groups=toks.map(t=>{ const al=ALIAS[t]||ALIAS[t.replace(/\.$/,"")]; return al?[t,...al]:[t]; });
    return {n,toks,groups};
  }
  function score(e,Q){
    let s=0,hit=0;
    Q.groups.forEach(g=>{ let best=0; g.forEach(w=>{ if(w.length<2) return;
      if(e.nt.includes(w)) best=Math.max(best,w.includes(" ")?5:3); else if(e.nx.includes(w)) best=Math.max(best,w.includes(" ")?3:1); });
      if(best){hit++; s+=best;} });
    if(!Q.groups.length) return 0;
    if(hit<Math.ceil(Q.groups.length*0.6)) return 0;
    if(Q.n.length>4 && e.nt.includes(Q.n)) s+=6;
    return s*(hit/Q.groups.length);
  }
  const SEC_RE=/\b(section|sections|sec|s|u\/s|article|art|rule|order)\.?\s*(\d+[a-z]?)(?:\s*\(\s*(\d+|[a-z])\s*\))?/i;

  function answer(raw){
    const q=raw.trim(); if(!q) return;
    const X=buildIndex(); const Q=expand(q); const n=Q.n;
    if(!LOADED) return bot(`<p>The site is still loading its data. Please ask again in a moment.</p>`);

    /* 1. Section / article of an Act */
    const m=q.match(SEC_RE);
    if(m){
      const kind=m[1].toLowerCase(), num=m[2];
      const rest=expand(q.replace(m[0]," "));
      const acts=X.filter(e=>e.type==="act");
      let act=null;
      if(/^art/.test(kind) && !rest.groups.length) act=acts.find(e=>e.slug==="constitution");
      if(!act && rest.groups.length){ act=acts.map(e=>[e,score(e,rest)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).map(x=>x[0])[0]||null; }
      if(!act && /^art/.test(kind)) act=acts.find(e=>e.slug==="constitution");
      const old=/\b(ipc|indian penal code|crpc|cr\.?p\.?c|evidence act|iea)\b/i.test(q);
      if(act){
        const label=/^art/.test(kind)?"Article":"Section";
        let note=old?`<p><b>Note:</b> the ${E(/ipc|penal/i.test(q)?"IPC":/crpc|cr\.?p/i.test(q)?"CrPC":"Indian Evidence Act")} was replaced on 1 July 2024, and section numbers changed in the new law. Old section numbers don't carry over, so search the new law by the offence or topic, for example “murder” or “cheating”, using the search box above the text.</p>`:"";
        if(old){ bot(`<p>Opening <b>${E(act.a.title)}</b>, the law in force now.</p>${note}`,[act]); act.go(); return; }
        bot(`<p>Opening <b>${E(act.a.title)}</b> and jumping to ${label} ${E(num)}.</p>`,[{...act,go:()=>openInReader("#a-"+act.slug,num+". ","act:"+act.slug),k:act.k+" · "+label+" "+num}]);
        openInReader("#a-"+act.slug,num+". ","act:"+act.slug);
        return;
      }
      return bot(`<p>Which Act is ${E(kind.startsWith("art")?"Article":"Section")} ${E(num)} from? Try, for example, “section ${E(num)} BNS” or “section ${E(num)} Contract Act”.</p>`,null,
        ["Section "+num+" BNS","Section "+num+" BNSS","Section "+num+" CPC","Article "+num+" Constitution"]);
    }

    /* 2. Latest / today's decisions */
    const wantsLatest=/\b(latest|today|todays|recent|new|this week)\b/.test(n);
    if(wantsLatest && /\b(supreme|sc)\b/.test(n)){
      const r=X.filter(e=>e.type==="digest"&&e.latest&&e.chap==="sc");
      return bot(r.length?`<p>Today's Supreme Court judgments and orders:</p>`:`<p>No Supreme Court entries in today's edition.</p>`,r.slice(0,8),null,{label:"Open the Supreme Court page",fn:()=>go("#supreme-court")});
    }
    if(wantsLatest && /\b(high court|hc|high courts)\b/.test(n)){
      const r=X.filter(e=>e.type==="digest"&&e.latest&&e.chap==="hc");
      return bot(`<p>Latest High Court decisions:</p>`,r.slice(0,8),null,{label:"Open the High Courts page",fn:()=>go("#high-courts")});
    }
    if(wantsLatest && /\b(tribunal|tribunals|nclt|nclat|itat|ngt|cestat|cat|cci)\b/.test(n)){
      const r=X.filter(e=>e.type==="tribunal"&&e.latest).map(e=>[e,Q.groups.length>2?score(e,Q):1]).filter(x=>x[1]>0).map(x=>x[0]);
      return bot(`<p>Latest tribunal orders:</p>`,r.slice(0,8),null,{label:"Open the Tribunals page",fn:()=>go("#tribunals")});
    }

    /* 3. Careers */
    const careerWords=/\b(job|jobs|internship|internships|vacancy|vacancies|recruitment|exam|exams|llm|ll\.m|clat|aibe|ailet|net|judiciary|civil judge|fellowship|fellowships|admission|admissions|career|careers|opening|openings|apply)\b/;
    if(careerWords.test(n)){
      let r=X.filter(e=>e.type==="career");
      if(/\b(closing|deadline|soon|last date|urgent)\b/.test(n)) r=r.filter(e=>e.soon);
      const secs=[]; if(/\b(judiciary|judicial|civil judge|judge|clerk|researcher)\b/.test(n)) secs.push("judiciary");
      if(/\b(llm|ll\.m|admission|admissions|ailet|clat)\b/.test(n)) secs.push("llm");
      if(/\b(aibe|net|exam|exams)\b/.test(n)&&!secs.includes("judiciary")) secs.push("exams");
      if(/\b(government|govt|psu|public sector)\b/.test(n)) secs.push("govt");
      if(/\b(private|law firm|firm|fellowship|fellowships)\b/.test(n)) secs.push("private");
      if(secs.length){ const f=r.filter(e=>secs.includes(e.sec)); if(f.length) r=f; }
      if(/\binternships?\b/.test(n)){ const f=r.filter(e=>/intern/i.test(e.t+" "+e.x)); if(f.length) r=f; }
      const generic=Q.groups.filter(g=>!careerWords.test(g[0])&&!/^(open|closing|soon|deadline|last|date|now|current|available)$/.test(g[0]));
      if(generic.length){ const QQ={...Q,groups:generic}; const sc=r.map(e=>[e,score(e,QQ)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).map(x=>x[0]); if(sc.length) r=sc; }
      return bot(r.length?`<p>Open and upcoming opportunities that match:</p>`:`<p>Nothing open right now matches that. The Careers Portal lists everything currently open.</p>`,r.slice(0,8),null,{label:"Open the Careers Portal",fn:()=>go("#careers")});
    }

    /* 4. General search across everything */
    const want={act:/\b(act|acts|bare|code|sanhita|adhiniyam|law|statute|rules?)\b/.test(n),
                case:/\b(judgment|judgement|case|cases|v|vs|versus|held|ruling|verdict|order)\b/.test(n)};
    let res=X.map(e=>{ let s=score(e,Q); if(!s) return null;
      if(want.act&&e.type==="act") s*=1.6; if(want.case&&e.type!=="act"&&e.type!=="career") s*=1.4;
      if(e.type==="judgment") s*=1.15; return [e,s]; }).filter(Boolean).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
    const seen=new Set(); res=res.filter(e=>{ const k=e.type+"|"+e.t; if(seen.has(k)) return false; seen.add(k); return true; });
    if(res.length){
      return bot(`<p>Here's what I found on Nirnay Daily for “${E(q)}”:</p>`,res.slice(0,7),null,
        res.length>7?{label:"More results in Landmark Judgments",fn:()=>go("#landmarks",q)}:null);
    }
    return bot(`<p>I couldn't find “${E(q)}” on Nirnay Daily. Try a case name, an Act, a section (like “section 103 BNS”), a court, or a job/exam.</p>`,null,
      ["Latest Supreme Court judgments","Judiciary exams open now","Article 21 Constitution","Maharashtra Rent Control Act"]);
  }

  /* ---------- chat UI ---------- */
  let log, input, panel, fab, cur=[];
  function bot(html,results,chips,more){
    const box=document.createElement("div"); box.className="nx-msg nx-bot"; box.innerHTML=html;
    if(results&&results.length){
      const wrap=document.createElement("div"); wrap.className="nx-res";
      results.forEach(r=>{ const a=document.createElement("a"); a.className="nx-card"; a.href="javascript:void 0"; a.style.setProperty("--c",r.c||"#9E2A2B");
        a.innerHTML=`<span class="k">${E(r.k)}</span><span class="t">${E(r.t)}</span>${r.s?`<span class="s">${E(r.s)}</span>`:""}`;
        a.onclick=ev=>{ev.preventDefault(); r.go();}; wrap.appendChild(a); });
      box.appendChild(wrap);
    }
    if(more){ const c=document.createElement("div"); c.className="nx-chips"; const b=document.createElement("button"); b.className="nx-chip"; b.textContent=more.label+" →"; b.onclick=more.fn; c.appendChild(b); box.appendChild(c); }
    if(chips&&chips.length){ const c=document.createElement("div"); c.className="nx-chips";
      chips.forEach(t=>{ const b=document.createElement("button"); b.className="nx-chip"; b.textContent=t; b.onclick=()=>ask(t); c.appendChild(b); }); box.appendChild(c); }
    log.appendChild(box); log.scrollTop=log.scrollHeight;
  }
  function me(t){ const d=document.createElement("div"); d.className="nx-msg nx-me"; d.textContent=t; log.appendChild(d); log.scrollTop=log.scrollHeight; }
  function ask(t){ me(t); try{ answer(t); }catch(e){ bot(`<p>Sorry, something went wrong with that search. Please try different words.</p>`); }
    try{ const last=log.querySelectorAll(".nx-bot"); const n=last.length?last[last.length-1].querySelectorAll(".nx-card").length:0;
      window.nirnayTrack&&window.nirnayTrack("search",{search_term:String(t).slice(0,100),results:n,found:n>0?"yes":"no",tool:"Nirnay Mitra"}); }catch(e){} }
  function toggle(open){ const o=open===undefined?panel.hidden:open; panel.hidden=!o; fab.setAttribute("aria-expanded",o); if(o) setTimeout(()=>input.focus(),50); }

  function mount(){
    fab=document.createElement("button"); fab.className="nx-fab"; fab.type="button"; fab.setAttribute("aria-label","Nirnay Mitra: search the site"); fab.setAttribute("aria-expanded","false");
    fab.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/><circle cx="11" cy="10" r="2.6"/><path d="M13 12l2.2 2.2"/></svg><span class="nx-lbl">Nirnay Mitra</span><span class="nx-dot"></span>`;
    panel=document.createElement("section"); panel.className="nx-panel"; panel.hidden=true; panel.setAttribute("aria-label","Nirnay Mitra");
    panel.innerHTML=`<div class="nx-head"><svg class="nx-seal" viewBox="0 0 400 400"><use href="#seal-mark"/></svg><div><b>NIRNAY MITRA <span class="nx-dv">निर्णय मित्र</span></b><small>Your guide to judgments, Acts, sections & careers</small></div><button class="nx-close" type="button" aria-label="Close">×</button></div>
      <div class="nx-log" role="log" aria-live="polite"></div>
      <form class="nx-form"><input type="text" placeholder="e.g. section 318 BNS, Puttaswamy, LLM admission" aria-label="Ask a question" autocomplete="off"><button type="submit">Ask</button></form>
      <div class="nx-note">Searches Nirnay Daily's own pages. Not legal advice.</div>`;
    document.body.appendChild(panel); document.body.appendChild(fab);
    log=panel.querySelector(".nx-log"); input=panel.querySelector("input");
    fab.onclick=()=>toggle(); panel.querySelector(".nx-close").onclick=()=>toggle(false);
    panel.querySelector("form").onsubmit=ev=>{ ev.preventDefault(); const t=input.value; input.value=""; if(t.trim()) ask(t); };
    document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!panel.hidden) toggle(false); });
    bot(`<p><b>Namaste! I'm Nirnay Mitra.</b> I can help you find anything on Nirnay Daily: a case or judgment, a Bare Act or a specific section, today's court and tribunal updates, or jobs, exams and LLM admissions.</p><p>Type your question, or try one of these:</p>`,null,
      ["Section 103 BNS","Article 21 Constitution","Latest Supreme Court judgments","Judiciary exams open now","Right to privacy","Maharashtra Rent Control Act","Jobs closing soon"]);
  }
  function start(){ mount(); if(/[?&]mitra=1\b/.test(location.search)){ toggle(true); try{ history.replaceState(null,"",location.pathname+location.hash); }catch(e){} } }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
