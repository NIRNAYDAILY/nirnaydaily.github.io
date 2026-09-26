/* Visitor statistics for Nirnay Daily (Google Analytics 4).
   Counts page and section views, and records the words typed into Nirnay Mitra
   so the site can be improved. No names, emails or other personal details are collected. */
(function(){
  var ID = window.NIRNAY_GA_ID || "";
  window.nirnayTrack = function(){};           /* no-op until an ID is set */
  if(!/^G-[A-Z0-9]+$/.test(ID)) return;
  var s=document.createElement("script"); s.async=true; s.src="https://www.googletagmanager.com/gtag/js?id="+ID; document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag=gtag;
  gtag("js",new Date());
  gtag("config",ID,{send_page_view:false,anonymize_ip:true});
  var SECTION={"":"Home","home":"Home","landmarks":"Landmark Judgments","library":"Full Judgments","bare-acts":"Bare Acts",
    "supreme-court":"Supreme Court","high-courts":"High Courts","district-courts":"District Courts","tribunals":"Tribunals","careers":"Careers Portal"};
  function view(){
    var h=(location.hash||"#home").slice(1), title;
    if(h.indexOf("j-")===0) title="Judgment: "+h.slice(2);
    else if(h.indexOf("a-")===0) title="Bare Act: "+h.slice(2);
    else title=SECTION[h]||"Home";
    gtag("event","page_view",{page_location:location.origin+location.pathname+"#"+h,page_path:"/"+h,page_title:"Nirnay Daily · "+title});
  }
  window.addEventListener("hashchange",view); view();
  window.nirnayTrack=function(name,params){ try{ gtag("event",name,params||{}); }catch(e){} };
})();
