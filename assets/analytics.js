/* Visitor statistics for Nirnay Daily (Google Analytics 4).
   Counts page and section views, the words typed into Nirnay Mitra and the section search boxes,
   downloads and link clicks, so the site can be improved.
   No names, emails or other personal details are collected.
   Owner visits: open https://nirnaydaily.github.io/?owner=1 once on each of your devices/browsers
   and your own visits are marked "internal" (excluded by GA's Internal Traffic filter).
   ?owner=0 removes the mark. */
(function(){
  var ID = window.NIRNAY_GA_ID || "";
  window.nirnayTrack = function(){};           /* no-op until an ID is set */
  if(!/^G-[A-Z0-9]+$/.test(ID)) return;

  /* ---- owner (internal traffic) flag ---- */
  var internal=false;
  try{
    var m=/[?&]owner=([01])/.exec(location.search);
    if(m){ if(m[1]==="1") localStorage.setItem("nd_owner","1"); else localStorage.removeItem("nd_owner"); }
    internal = localStorage.getItem("nd_owner")==="1";
  }catch(e){}

  var s=document.createElement("script"); s.async=true; s.src="https://www.googletagmanager.com/gtag/js?id="+ID; document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag=gtag;
  gtag("js",new Date());
  var cfg={send_page_view:false,anonymize_ip:true};
  if(internal) cfg.traffic_type="internal";
  gtag("config",ID,cfg);

  var SECTION={"":"Home","home":"Home","landmarks":"Landmark Judgments","library":"Full Judgments","bare-acts":"Bare Acts",
    "supreme-court":"Supreme Court","high-courts":"High Courts","district-courts":"District Courts","tribunals":"Tribunals",
    "careers":"Careers Portal","news":"Legal News","news-archive":"News Archive"};
  var path=location.pathname.replace(/index\.html$/,"");
  var isHome = path==="/" || path==="";
  /* the query string (utm_source etc.) is kept so Instagram / WhatsApp visits are credited correctly */
  var qs=location.search.replace(/[?&](owner|r)=[^&]*/g,"").replace(/^&/,"?");
  if(qs==="?") qs="";

  function current(){
    if(!isHome){
      if(/^\/journal\/?$/.test(path)) return {key:"journal",title:"Monthly Journal",section:"Monthly Journal"};
      if(/^\/privacy/.test(path)) return {key:"privacy",title:"Privacy Notice",section:"Privacy Notice"};
      return {key:path,title:document.title,section:"Other"};
    }
    var h=(location.hash||"#home").slice(1);
    if(h.indexOf("j-")===0) return {key:h,title:"Judgment: "+h.slice(2),section:"Full Judgments"};
    if(h.indexOf("a-")===0) return {key:h,title:"Bare Act: "+h.slice(2),section:"Bare Acts"};
    var t=SECTION[h]; if(!t){ h="home"; t="Home"; }
    return {key:h,title:t,section:t};
  }
  window.nirnaySection=function(){ return current().section; };

  function view(){
    var c=current(), loc;
    if(isHome) loc=location.origin+"/"+qs+"#"+c.key; else loc=location.origin+path+qs;
    gtag("event","page_view",{page_location:loc,page_path:isHome?"/"+c.key:path,page_title:"Nirnay Daily · "+c.title,site_section:c.section});
  }
  if(isHome) window.addEventListener("hashchange",view);
  view();

  window.nirnayTrack=function(name,params){
    try{ params=params||{}; if(!params.site_section) params.site_section=current().section; gtag("event",name,params); }catch(e){}
  };

  /* ---- searches typed into the section search boxes (sent once the reader stops typing) ---- */
  var timer=null, lastSent="";
  document.addEventListener("input",function(ev){
    var el=ev.target;
    if(!el || el.tagName!=="INPUT" || el.type!=="search") return;
    clearTimeout(timer);
    timer=setTimeout(function(){
      var q=(el.value||"").trim();
      if(q.length<3 || q.toLowerCase()===lastSent) return;
      lastSent=q.toLowerCase();
      var label=el.getAttribute("aria-label")||"Search";
      window.nirnayTrack("search",{search_term:q.slice(0,100),search_tool:label});
    },1500);
  },true);

  /* ---- clicks on links to other websites (careers apply links, official sources, etc.) ---- */
  document.addEventListener("click",function(ev){
    var a=ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if(!a) return;
    var href=a.href||"";
    if(!/^https?:/i.test(href) || a.host===location.host || /instagram\.com/i.test(href)) return;
    var text=(a.textContent||"").replace(/\s+/g," ").trim().slice(0,100);
    var sec=current().section;
    window.nirnayTrack(sec==="Careers Portal"?"career_link_click":"external_link_click",
      {link_url:href.slice(0,300),link_text:text,link_domain:a.hostname,site_section:sec});
  },true);

  /* ---- filter buttons (court, category, theme) ---- */
  document.addEventListener("click",function(ev){
    var b=ev.target && ev.target.closest ? ev.target.closest("[data-f],[data-cat],[data-th],[data-lc],[data-ac]") : null;
    if(!b) return;
    window.nirnayTrack("filter_click",{filter_value:(b.textContent||"").replace(/\s+/g," ").trim().slice(0,60)});
  },true);

  /* ---- Nirnay Mitra chat box opened ---- */
  document.addEventListener("click",function(ev){
    var b=ev.target && ev.target.closest ? ev.target.closest(".nx-fab") : null;
    if(b && b.getAttribute("aria-expanded")!=="true") window.nirnayTrack("mitra_open",{});
  },true);
})();
