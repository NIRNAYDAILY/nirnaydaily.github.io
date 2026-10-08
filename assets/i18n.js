/* Nirnay Daily — English / हिन्दी / मराठी
   How it works:
   1. The reader picks a language in the dropdown under the Refresh button. The choice is kept in this browser.
   2. Fixed wording on the site (menus, buttons, headings, notes) is translated from the dictionary below,
      which follows the word list approved by the editor on 8 Oct 2026.
   3. Daily content (summaries, news, careers) is shown in Hindi or Marathi when the data carries an "i18n"
      block, e.g. {"headline": "...", "i18n": {"hi": {"headline": "..."}, "mr": {"headline": "..."}}}.
   Case titles, citations, case numbers, judges' names and official texts are never translated. */
(function () {
  "use strict";
  var KEY = "nd-lang", LANGS = ["en", "hi", "mr"];
  var q = (location.search.match(/[?&]lang=(en|hi|mr)\b/) || [])[1];
  var lang = q || (function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } })() || "en";
  if (LANGS.indexOf(lang) < 0) lang = "en";
  if (q) { try { localStorage.setItem(KEY, q); } catch (e) {} }
  window.ND_LANG = lang;
  var H = lang === "hi", I = lang === "hi" ? 0 : 1;
  document.documentElement.setAttribute("data-lang", lang);
  if (lang !== "en") document.documentElement.lang = lang;

  /* ---------- the dropdown (works in every language) ---------- */
  function mountPicker() {
    var sel = document.getElementById("nd-lang");
    if (!sel) return;
    sel.value = lang;
    sel.onchange = function () {
      try { localStorage.setItem(KEY, sel.value); } catch (e) {}
      try { window.nirnayTrack && window.nirnayTrack("language_change", { language: sel.value }); } catch (e) {}
      var s = location.search.replace(/([?&])lang=(en|hi|mr)&?/, "$1").replace(/[?&]$/, "");
      location.replace(location.pathname + s + location.hash);
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountPicker); else mountPicker();

  /* ---------- data overlay (used even in English, so nothing breaks) ---------- */
  function overlay(o) {
    if (!o || typeof o !== "object") return o;
    if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) overlay(o[i]); return o; }
    var t = lang !== "en" && o.i18n && o.i18n[lang];
    if (t) { o._en = {}; for (var k in t) { if (t[k] !== "" && t[k] != null) { o._en[k] = o[k]; o[k] = t[k]; } } }
    for (var k2 in o) { if (k2 !== "i18n" && k2 !== "_en" && o[k2] && typeof o[k2] === "object") overlay(o[k2]); }
    return o;
  }
  window.ndLocalize = overlay;
  window.ndLandmarks = function (L) {
    if (lang === "en" || !window.ND_LM) return;
    L.forEach(function (x) {
      var t = window.ND_LM[x.name]; if (!t) return;
      var held = t[H ? 0 : 2], note = t[H ? 1 : 3];
      if (held) x.held = held;
      if (x.note && note) x.note = note;
    });
  };
  if (lang === "en") return;

  /* ---------- dictionary: English -> [Hindi, Marathi] ---------- */
  var T = [
  // header, menu, footer
  ["↻ Refresh", "↻ रीफ़्रेश करें", "↻ रिफ्रेश करा"],
  ["Load the latest version of the website", "वेबसाइट का नवीनतम संस्करण लोड करें", "वेबसाइटची नवीन आवृत्ती लोड करा"],
  ["Language", "भाषा", "भाषा"],
  ["Judgments daily · Legal news 10 AM & 6 PM · Careers every Saturday", "रोज़ निर्णय · कानूनी समाचार सुबह 10 और शाम 6 बजे · करियर हर शनिवार", "रोज निकाल · कायदेविषयक बातम्या सकाळी 10 व संध्याकाळी 6 वाजता · करिअर दर शनिवारी"],
  ["Follow Nirnay Daily on Instagram", "Instagram पर Nirnay Daily को फ़ॉलो करें", "Instagram वर Nirnay Daily ला फॉलो करा"],
  ["Judgments · Orders · Landmark Cases · Careers in Law", "निर्णय · आदेश · ऐतिहासिक मामले · कानून में करियर", "निकाल · आदेश · ऐतिहासिक प्रकरणे · कायद्यातील करिअर"],
  ["India's Courts · Decoded Daily", "भारत के न्यायालय · रोज़ सरल भाषा में", "भारतातील न्यायालये · रोज सोप्या भाषेत"],
  ["Est. 2026", "स्थापना 2026", "स्थापना 2026"],
  ["Sections", "विभाग", "विभाग"],
  ["Home", "मुख्य पृष्ठ", "मुख्यपृष्ठ"],
  ["Landmark Judgments", "ऐतिहासिक निर्णय", "ऐतिहासिक निकाल"],
  ["Full Judgments", "संपूर्ण निर्णय", "संपूर्ण निकालपत्रे"],
  ["Bare Acts", "अधिनियम (मूल पाठ)", "अधिनियम (मूळ पाठ)"],
  ["Supreme Court", "सर्वोच्च न्यायालय", "सर्वोच्च न्यायालय"],
  ["High Courts", "उच्च न्यायालय", "उच्च न्यायालये"],
  ["District Courts", "ज़िला न्यायालय", "जिल्हा न्यायालये"],
  ["Tribunals", "न्यायाधिकरण", "न्यायाधिकरणे"],
  ["Legal News", "कानूनी समाचार", "कायदेविषयक बातम्या"],
  ["Legal news", "कानूनी समाचार", "कायदेविषयक बातम्या"],
  ["Careers Portal", "करियर पोर्टल", "करिअर पोर्टल"],
  ["Monthly Journal", "मासिक पत्रिका", "मासिक अंक"],
  ["A daily digest of Indian court judgments, a library of landmark decisions, and a careers portal for law students and young lawyers.", "भारतीय न्यायालयों के निर्णयों का दैनिक सार, ऐतिहासिक निर्णयों का संग्रह, और कानून के छात्रों और युवा वकीलों के लिए करियर पोर्टल।", "भारतीय न्यायालयांच्या निकालांचा दैनंदिन सारांश, ऐतिहासिक निकालांचा संग्रह, आणि कायद्याचे विद्यार्थी व तरुण वकिलांसाठी करिअर पोर्टल."],
  ["Contact us", "संपर्क करें", "संपर्क साधा"],
  ["Questions, corrections or suggestions about the website? Write to us and we will get back to you.", "वेबसाइट के बारे में कोई प्रश्न, सुधार या सुझाव? हमें लिखें, हम आपको उत्तर देंगे।", "वेबसाइटबद्दल प्रश्न, दुरुस्ती किंवा सूचना? आम्हाला लिहा, आम्ही तुम्हाला उत्तर देऊ."],
  ["Notice", "सूचना", "सूचना"],
  ["Indian Court Judgments, Bare Acts & Law Careers", "भारतीय न्यायालयों के निर्णय, अधिनियम एवं कानूनी करियर", "भारतीय न्यायालयांचे निकाल, अधिनियम व कायदेविषयक करिअर"],
  ["Summaries are drawn from court records and established legal publications and are for information only. They are not legal advice. Read the full judgment and the official notification before relying on anything here.", "ये सारांश न्यायालय के अभिलेखों और प्रतिष्ठित कानूनी प्रकाशनों से लिए गए हैं और केवल जानकारी के लिए हैं। ये कानूनी सलाह नहीं हैं। यहाँ दी गई किसी भी बात पर भरोसा करने से पहले पूरा निर्णय और आधिकारिक अधिसूचना पढ़ें।", "हे सारांश न्यायालयीन नोंदी आणि मान्यताप्राप्त कायदेविषयक प्रकाशनांतून घेतले असून केवळ माहितीसाठी आहेत. हा कायदेशीर सल्ला नाही. येथील कोणत्याही गोष्टीवर विसंबण्यापूर्वी संपूर्ण निकाल आणि अधिकृत अधिसूचना वाचा."],
  ["This site counts visits, searches and link clicks (through Google Analytics) to improve the site. Readers who sign in share only their name and email, kept to manage their free account.", "साइट को बेहतर बनाने के लिए यह साइट (Google Analytics के माध्यम से) विज़िट, खोज और लिंक क्लिक गिनती है। साइन इन करने वाले पाठक केवल अपना नाम और ईमेल साझा करते हैं, जो उनके निःशुल्क खाते के प्रबंधन के लिए रखे जाते हैं।", "साइट सुधारण्यासाठी ही साइट (Google Analytics द्वारे) भेटी, शोध आणि लिंक क्लिक मोजते. साइन इन करणारे वाचक फक्त त्यांचे नाव व ईमेल देतात, जे त्यांच्या मोफत खात्याच्या व्यवस्थापनासाठी ठेवले जातात."],
  ["Privacy Notice", "गोपनीयता सूचना", "गोपनीयता सूचना"],
  ["Email:", "ईमेल:", "ईमेल:"],
  ["Instagram:", "Instagram:", "Instagram:"],
  ["Nirnay Daily home", "Nirnay Daily मुख्य पृष्ठ", "Nirnay Daily मुख्यपृष्ठ"],
  ["← Nirnay Daily home", "← Nirnay Daily मुख्य पृष्ठ", "← Nirnay Daily मुख्यपृष्ठ"],

  // home / about
  ["About the portal", "पोर्टल के बारे में", "पोर्टलविषयी"],
  ["Know the law · Know your rights", "कानून जानिए · अपने अधिकार जानिए", "कायदा जाणा · आपले हक्क जाणा"],
  ["Every Nirnay Matters.", "हर निर्णय मायने रखता है।", "प्रत्येक निर्णय महत्त्वाचा आहे."],
  ["India's courts and lawmakers take decisions every day that shape your rights, your society and your future. Nirnay Daily brings them to you — clear, verified and on time.",
   "भारत के न्यायालय और विधि-निर्माता हर दिन ऐसे निर्णय लेते हैं जो आपके अधिकारों, आपके समाज और आपके भविष्य को आकार देते हैं। Nirnay Daily उन्हें आप तक पहुँचाता है — स्पष्ट, सत्यापित और समय पर।",
   "भारतातील न्यायालये आणि कायदेमंडळे दररोज असे निर्णय घेतात जे तुमचे हक्क, तुमचा समाज आणि तुमचे भविष्य घडवतात. Nirnay Daily ते तुमच्यापर्यंत पोहोचवते — स्पष्ट, पडताळलेले आणि वेळेवर."],
  ["Read Today's Judgments", "आज के निर्णय पढ़ें", "आजचे निकाल वाचा"],
  ["Explore Careers in Law", "कानून में करियर देखें", "कायद्यातील करिअर पाहा"],
  ["⚖️ The Decisions That Shape India", "⚖️ भारत को आकार देने वाले निर्णय", "⚖️ भारत घडवणारे निर्णय"],
  ["From the Supreme Court to your district court, from Parliament to the State Legislatures, we follow the judgments, orders and laws that define how India is governed and how your rights are protected. Every ruling is summarised in plain language and linked to its source.",
   "सर्वोच्च न्यायालय से आपके जिला न्यायालय तक, संसद से राज्य विधानमंडलों तक, हम उन निर्णयों, आदेशों और कानूनों पर नज़र रखते हैं जो तय करते हैं कि भारत का शासन कैसे चलता है और आपके अधिकारों की रक्षा कैसे होती है। हर निर्णय सरल भाषा में संक्षेपित और उसके स्रोत से जुड़ा होता है।",
   "सर्वोच्च न्यायालयापासून तुमच्या जिल्हा न्यायालयापर्यंत, संसदेपासून राज्य विधिमंडळांपर्यंत, भारताचा कारभार कसा चालतो आणि तुमच्या हक्कांचे रक्षण कसे होते हे ठरवणारे निकाल, आदेश आणि कायदे आम्ही पाहतो. प्रत्येक निकाल सोप्या भाषेत सारांशित आणि त्याच्या स्रोताशी जोडलेला असतो."],
  ["🎯 The Decisions That Shape You", "🎯 आपको आकार देने वाले निर्णय", "🎯 तुम्हाला घडवणारे निर्णय"],
  ["Your career is your own Nirnay. We track judicial service exams, government legal posts, LLM admissions, internships and fellowships, each verified on the official website, so you can focus on preparing, not searching.",
   "आपका करियर आपका अपना निर्णय है। हम न्यायिक सेवा परीक्षाओं, सरकारी कानूनी पदों, LLM प्रवेश, इंटर्नशिप और फ़ेलोशिप पर नज़र रखते हैं, हर एक आधिकारिक वेबसाइट पर सत्यापित, ताकि आप खोजने के बजाय तैयारी पर ध्यान दे सकें।",
   "तुमचे करिअर हा तुमचा स्वतःचा निर्णय आहे. आम्ही न्यायिक सेवा परीक्षा, सरकारी कायदेविषयक पदे, LLM प्रवेश, इंटर्नशिप आणि फेलोशिप यांचा मागोवा घेतो, प्रत्येक अधिकृत संकेतस्थळावर पडताळलेले, जेणेकरून तुम्ही शोधण्याऐवजी तयारीवर लक्ष देऊ शकाल."],
  ["📚 Knowledge You Can Rely On", "📚 भरोसेमंद ज्ञान", "📚 विश्वासार्ह ज्ञान"],
  ["Landmark judgments, full Supreme Court texts, Bare Acts and a monthly journal, built from official records and established legal publications, not hearsay.",
   "ऐतिहासिक निर्णय, सर्वोच्च न्यायालय के पूर्ण पाठ, बेयर एक्ट्स और मासिक पत्रिका, आधिकारिक अभिलेखों और प्रतिष्ठित कानूनी प्रकाशनों से तैयार, सुनी-सुनाई बातों से नहीं।",
   "ऐतिहासिक निकाल, सर्वोच्च न्यायालयाचे संपूर्ण मजकूर, बेअर ॲक्ट्स आणि मासिक नियतकालिक, अधिकृत नोंदी आणि मान्यताप्राप्त कायदेविषयक प्रकाशनांतून तयार केलेले, ऐकीव गोष्टींवरून नव्हे."],
  ["Judgments daily · Legal News at 10 AM & 6 PM · Careers every Saturday · Sourced from official records",
   "निर्णय रोज़ · कानूनी समाचार सुबह 10 और शाम 6 बजे · करियर हर शनिवार · आधिकारिक अभिलेखों पर आधारित",
   "निकाल दररोज · कायदेविषयक बातम्या सकाळी 10 व सायं. 6 वाजता · करिअर दर शनिवारी · अधिकृत नोंदींवर आधारित"],
  ["Know the law. Know your rights. Make your Nirnay.", "कानून जानिए। अपने अधिकार जानिए। अपना निर्णय लीजिए।", "कायदा जाणा. आपले हक्क जाणा. आपला निर्णय घ्या."],
  ["India's courts, read and explained every day.", "भारत के न्यायालय, हर दिन पढ़े और समझाए गए।", "भारतातील न्यायालये, दररोज वाचून समजावून सांगितलेली."],
  ["nir·nay · noun · Hindi / Sanskrit", "निर्णय · संज्ञा · हिन्दी / संस्कृत", "निर्णय · नाम · हिंदी / संस्कृत"],
  ["A decision; a judgment.", "निर्णय; फ़ैसला।", "निर्णय; निकाल."],
  ["The word for a court's final pronouncement, and the reason this portal exists: to carry those decisions from the courtroom to the reader.", "न्यायालय की अंतिम घोषणा के लिए शब्द, और इस पोर्टल के होने का कारण: उन निर्णयों को अदालत से पाठक तक पहुँचाना।", "न्यायालयाच्या अंतिम घोषणेसाठीचा शब्द, आणि हे पोर्टल असण्याचे कारण: ते निकाल न्यायालयातून वाचकापर्यंत पोहोचवणे."],
  ["The Preamble · Constitution of India", "उद्देशिका · भारत का संविधान", "उद्देशिका · भारताचे संविधान"],
  ["WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE, social, economic and political; LIBERTY of thought, expression, belief, faith and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation.",
   "हम, भारत के लोग, भारत को एक सम्पूर्ण प्रभुत्व-सम्पन्न समाजवादी पंथनिरपेक्ष लोकतंत्रात्मक गणराज्य बनाने के लिए, तथा उसके समस्त नागरिकों को: सामाजिक, आर्थिक और राजनैतिक न्याय, विचार, अभिव्यक्ति, विश्वास, धर्म और उपासना की स्वतंत्रता, प्रतिष्ठा और अवसर की समता प्राप्त कराने के लिए, तथा उन सब में व्यक्ति की गरिमा और राष्ट्र की एकता और अखण्डता सुनिश्चित करने वाली बंधुता बढ़ाने के लिए दृढ़संकल्प होकर अपनी इस संविधान सभा में आज तारीख 26 नवम्बर, 1949 ई. (मिति मार्गशीर्ष शुक्ल सप्तमी, संवत् दो हजार छह विक्रमी) को एतद्द्वारा इस संविधान को अंगीकृत, अधिनियमित और आत्मार्पित करते हैं।",
   "आम्ही, भारताचे लोक, भारताचे एक सार्वभौम समाजवादी धर्मनिरपेक्ष लोकशाही गणराज्य घडविण्याचा व त्याच्या सर्व नागरिकांस: सामाजिक, आर्थिक व राजनैतिक न्याय; विचार, अभिव्यक्ती, विश्वास, श्रद्धा व उपासना यांचे स्वातंत्र्य; दर्जाची व संधीची समानता; निश्चितपणे प्राप्त करून देण्याचा; आणि त्या सर्वांमध्ये व्यक्तीची प्रतिष्ठा व राष्ट्राची एकता आणि एकात्मता यांचे आश्वासन देणारी बंधुता प्रवर्धित करण्याचा संकल्पपूर्वक निर्धार करून; आमच्या संविधानसभेत आज दिनांक सव्वीस नोव्हेंबर, 1949 रोजी याद्वारे हे संविधान अंगीकृत आणि अधिनियमित करून स्वतःप्रत अर्पण करीत आहोत."],
  ["irnay Daily is an independent Indian legal information portal built for law students, advocates, judicial aspirants, researchers and every citizen who wants to understand how the courts are shaping the law of the land. Each day, our editorial desk reads through the judgments and orders delivered by the Supreme Court of India, all twenty-five High Courts, district and sessions courts, and the country's principal tribunals, and distils them into clear, accurate and readable summaries. Every entry carries what a legal professional needs to rely on it: the full case title, the neutral or reported citation, the case number, the coram and the date of decision, together with a direct link to the judgment or to an established legal publication, so that each reader can go to the source and read the court's own words. Alongside the daily digest, Nirnay Daily maintains a growing library of landmark judgments, from the foundational constitutional rulings of the 1950s to the most significant decisions of the present day, arranged by decade and subject so that students and practitioners can trace how a principle took shape. Our Careers Portal brings together judicial service examinations, court and government legal posts, internships, fellowships, the All India Bar Examination and LLM admissions, with every listing verified against the recruiting body's official website. We work only from official and recognised legal sources, never invent a case or a citation, and correct ourselves openly. Our aim is simple: to make the working of Indian justice accessible, dependable and useful to everyone who studies, practises or cares about the law.",
   "Nirnay Daily (निर्णय) एक स्वतंत्र भारतीय कानूनी जानकारी पोर्टल है, जो कानून के छात्रों, वकीलों, न्यायिक सेवा की तैयारी करने वालों, शोधकर्ताओं और हर उस नागरिक के लिए बनाया गया है जो समझना चाहता है कि न्यायालय देश के कानून को कैसे आकार दे रहे हैं। हर दिन हमारी संपादकीय टीम भारत के सर्वोच्च न्यायालय, सभी पच्चीस उच्च न्यायालयों, ज़िला एवं सत्र न्यायालयों और देश के प्रमुख न्यायाधिकरणों के निर्णय और आदेश पढ़ती है, और उन्हें स्पष्ट, सटीक और पढ़ने में आसान सारांशों में प्रस्तुत करती है। हर प्रविष्टि में वह सब होता है जिस पर एक कानूनी पेशेवर भरोसा कर सके: मामले का पूरा शीर्षक, न्यूट्रल या रिपोर्टेड साइटेशन, मामला संख्या, पीठ (कोरम) और निर्णय की तिथि, साथ में निर्णय या किसी प्रतिष्ठित कानूनी प्रकाशन का सीधा लिंक, ताकि हर पाठक मूल स्रोत तक जाकर न्यायालय के अपने शब्द पढ़ सके। दैनिक सार के साथ, Nirnay Daily ऐतिहासिक निर्णयों का एक बढ़ता हुआ संग्रह भी रखता है, 1950 के दशक के बुनियादी संवैधानिक निर्णयों से लेकर आज के सबसे महत्वपूर्ण निर्णयों तक, दशक और विषय के अनुसार, ताकि छात्र और वकील देख सकें कि कोई सिद्धांत कैसे बना। हमारा करियर पोर्टल न्यायिक सेवा परीक्षाओं, न्यायालय और सरकारी कानूनी पदों, इंटर्नशिप, फ़ेलोशिप, अखिल भारतीय बार परीक्षा और एलएल.एम. प्रवेश को एक जगह लाता है, और हर सूचना को भर्ती करने वाली संस्था की आधिकारिक वेबसाइट से जाँचा जाता है। हम केवल आधिकारिक और मान्यता प्राप्त कानूनी स्रोतों से काम करते हैं, कभी कोई मामला या साइटेशन नहीं गढ़ते, और अपनी गलतियाँ खुलकर सुधारते हैं। हमारा उद्देश्य सरल है: भारतीय न्याय व्यवस्था के कामकाज को हर उस व्यक्ति के लिए सुलभ, भरोसेमंद और उपयोगी बनाना जो कानून पढ़ता है, उसका अभ्यास करता है या उसकी परवाह करता है।",
   "Nirnay Daily (निर्णय) हे एक स्वतंत्र भारतीय कायदेविषयक माहिती पोर्टल आहे. कायद्याचे विद्यार्थी, वकील, न्यायिक सेवेची तयारी करणारे, संशोधक आणि न्यायालये देशाचा कायदा कसा घडवत आहेत हे समजून घेऊ इच्छिणाऱ्या प्रत्येक नागरिकासाठी ते तयार केले आहे. दररोज आमचा संपादकीय विभाग भारताचे सर्वोच्च न्यायालय, सर्व पंचवीस उच्च न्यायालये, जिल्हा व सत्र न्यायालये आणि देशातील प्रमुख न्यायाधिकरणांचे निकाल व आदेश वाचतो, आणि त्यांचे स्पष्ट, अचूक व वाचायला सोपे सारांश तयार करतो. प्रत्येक नोंदीत कायदेविषयक व्यावसायिकाला विसंबून राहण्यासाठी आवश्यक ते सर्व असते: प्रकरणाचे पूर्ण शीर्षक, न्यूट्रल किंवा रिपोर्टेड साइटेशन, प्रकरण क्रमांक, खंडपीठ (कोरम) आणि निकालाची तारीख, सोबत निकालाची किंवा मान्यताप्राप्त कायदेविषयक प्रकाशनाची थेट लिंक, जेणेकरून प्रत्येक वाचक मूळ स्रोतापर्यंत जाऊन न्यायालयाचे स्वतःचे शब्द वाचू शकेल. दैनंदिन सारांशासोबतच Nirnay Daily ऐतिहासिक निकालांचा वाढता संग्रह ठेवते, 1950 च्या दशकातील पायाभूत संवैधानिक निकालांपासून आजच्या सर्वांत महत्त्वाच्या निकालांपर्यंत, दशक व विषयानुसार मांडलेला, जेणेकरून विद्यार्थी व वकिलांना एखादे तत्त्व कसे घडले ते पाहता येईल. आमचे करिअर पोर्टल न्यायिक सेवा परीक्षा, न्यायालयीन व सरकारी कायदेविषयक पदे, इंटर्नशिप, फेलोशिप, अखिल भारतीय बार परीक्षा आणि एलएल.एम. प्रवेश एकत्र आणते, आणि प्रत्येक माहिती भरती करणाऱ्या संस्थेच्या अधिकृत वेबसाइटवरून तपासलेली असते. आम्ही केवळ अधिकृत आणि मान्यताप्राप्त कायदेविषयक स्रोतांवरून काम करतो, कधीही कोणतेही प्रकरण किंवा साइटेशन रचत नाही, आणि आमच्या चुका उघडपणे दुरुस्त करतो. आमचे उद्दिष्ट सोपे आहे: भारतीय न्यायव्यवस्थेचे कामकाज कायद्याचा अभ्यास करणाऱ्या, व्यवसाय करणाऱ्या किंवा कायद्याची काळजी असणाऱ्या प्रत्येकासाठी सुलभ, विश्वासार्ह आणि उपयुक्त करणे."],
  ["Accuracy first", "सटीकता सबसे पहले", "अचूकता सर्वप्रथम"],
  ["Case titles, citations, case numbers and benches are copied from the judgment or a recognised legal report, never guessed.", "मामलों के शीर्षक, साइटेशन, मामला संख्या और पीठ निर्णय या किसी मान्यता प्राप्त कानूनी रिपोर्ट से लिए जाते हैं, कभी अनुमान से नहीं।", "प्रकरणांची शीर्षके, साइटेशन, प्रकरण क्रमांक आणि खंडपीठ निकालातून किंवा मान्यताप्राप्त कायदेविषयक अहवालातून घेतले जातात, कधीही अंदाजाने नाही."],
  ["Official and legal sources only", "केवल आधिकारिक और कानूनी स्रोत", "केवळ अधिकृत व कायदेविषयक स्रोत"],
  ["Court websites, government notifications and established legal publications. Nothing from unverified sources.", "न्यायालयों की वेबसाइटें, सरकारी अधिसूचनाएँ और प्रतिष्ठित कानूनी प्रकाशन। अपुष्ट स्रोतों से कुछ भी नहीं।", "न्यायालयांची संकेतस्थळे, सरकारी अधिसूचना आणि मान्यताप्राप्त कायदेविषयक प्रकाशने. अपुष्ट स्रोतांतून काहीही नाही."],
  ["Every court, every day", "हर न्यायालय, हर दिन", "प्रत्येक न्यायालय, दररोज"],
  ["The Supreme Court, all High Courts, district courts and tribunals, updated each morning by 11:00 AM IST.", "सर्वोच्च न्यायालय, सभी उच्च न्यायालय, ज़िला न्यायालय और न्यायाधिकरण, हर सुबह 11:00 बजे (IST) तक अपडेट।", "सर्वोच्च न्यायालय, सर्व उच्च न्यायालये, जिल्हा न्यायालये व न्यायाधिकरणे, दररोज सकाळी 11:00 वाजेपर्यंत (IST) अद्ययावत."],
  ["Careers you can trust", "भरोसेमंद करियर जानकारी", "विश्वासार्ह करिअर माहिती"],
  ["Dates, fees and eligibility are read from the recruiting body's own notice, refreshed every Saturday.", "तिथियाँ, शुल्क और पात्रता भर्ती करने वाली संस्था की अपनी सूचना से ली जाती हैं, और हर शनिवार अपडेट की जाती हैं।", "तारखा, शुल्क आणि पात्रता भरती करणाऱ्या संस्थेच्या स्वतःच्या सूचनेतून घेतल्या जातात, आणि दर शनिवारी अद्ययावत केल्या जातात."],

  // common page parts
  ["Daily judgments & orders", "दैनिक निर्णय एवं आदेश", "दैनंदिन निकाल व आदेश"],
  ["Supreme Court of India", "भारत का सर्वोच्च न्यायालय", "भारताचे सर्वोच्च न्यायालय"],
  ["District & Sessions Courts", "ज़िला एवं सत्र न्यायालय", "जिल्हा व सत्र न्यायालये"],
  ["District & Trial Courts", "ज़िला एवं विचारण न्यायालय", "जिल्हा व कनिष्ठ न्यायालये"],
  ["Judgments and orders of the apex court", "सर्वोच्च न्यायालय के निर्णय और आदेश", "सर्वोच्च न्यायालयाचे निकाल व आदेश"],
  ["Decisions from High Courts across India", "देश भर के उच्च न्यायालयों के निर्णय", "देशभरातील उच्च न्यायालयांचे निकाल"],
  ["Trial, sessions and special courts", "विचारण, सत्र एवं विशेष न्यायालय", "कनिष्ठ, सत्र व विशेष न्यायालये"],
  ["NCLAT, NCLT, CESTAT, ITAT, CCI and more", "NCLAT, NCLT, CESTAT, ITAT, CCI और अन्य", "NCLAT, NCLT, CESTAT, ITAT, CCI व इतर"],
  ["Today's judgments and orders appear first. Scroll down for earlier editions, or search across all of them.", "आज के निर्णय और आदेश सबसे पहले दिखते हैं। पिछले संस्करणों के लिए नीचे स्क्रॉल करें, या सभी में खोजें।", "आजचे निकाल व आदेश सर्वप्रथम दिसतात. मागील आवृत्त्यांसाठी खाली स्क्रोल करा, किंवा सर्वांमध्ये शोधा."],
  ["Today's High Court decisions appear first, court by court. Earlier editions follow below.", "आज के उच्च न्यायालयों के निर्णय सबसे पहले, न्यायालय-वार दिखते हैं। पिछले संस्करण नीचे हैं।", "आजचे उच्च न्यायालयांचे निकाल सर्वप्रथम, न्यायालयनिहाय दिसतात. मागील आवृत्त्या खाली आहेत."],
  ["Today's district, sessions, family and special court rulings first, then earlier editions.", "पहले आज के ज़िला, सत्र, कुटुंब और विशेष न्यायालयों के निर्णय, फिर पिछले संस्करण।", "आधी आजचे जिल्हा, सत्र, कौटुंबिक व विशेष न्यायालयांचे निकाल, नंतर मागील आवृत्त्या."],
  ["Today's orders of NCLAT, NCLT, NGT, ITAT, CESTAT, CAT, CCI and other tribunals first, then earlier editions.", "पहले आज के NCLAT, NCLT, NGT, ITAT, CESTAT, CAT, CCI और अन्य न्यायाधिकरणों के आदेश, फिर पिछले संस्करण।", "आधी आजचे NCLAT, NCLT, NGT, ITAT, CESTAT, CAT, CCI व इतर न्यायाधिकरणांचे आदेश, नंतर मागील आवृत्त्या."],
  ["Search this and earlier editions", "इस और पिछले संस्करणों में खोजें", "ही आणि मागील आवृत्त्यांमध्ये शोधा"],
  ["Search", "खोजें", "शोधा"],
  ["● Latest edition", "● नवीनतम संस्करण", "● नवीन आवृत्ती"],
  ["Latest edition", "नवीनतम संस्करण", "नवीन आवृत्ती"],
  ["Earlier edition", "पिछला संस्करण", "मागील आवृत्ती"],
  ["Earlier editions", "पिछले संस्करण", "मागील आवृत्त्या"],
  ["Judgments", "निर्णय", "निकाल"],
  ["Orders", "आदेश", "आदेश"],
  ["Case title not yet reported", "मामले का शीर्षक अभी प्रकाशित नहीं", "प्रकरणाचे शीर्षक अद्याप प्रसिद्ध नाही"],
  ["Why it matters.", "यह क्यों महत्वपूर्ण है।", "हे का महत्त्वाचे आहे."],
  ["Why it matters", "यह क्यों महत्वपूर्ण है", "हे का महत्त्वाचे आहे"],
  ["Source", "स्रोत", "स्रोत"],
  ["No Supreme Court entries in this edition.", "इस संस्करण में सर्वोच्च न्यायालय की कोई प्रविष्टि नहीं है।", "या आवृत्तीत सर्वोच्च न्यायालयाची एकही नोंद नाही."],
  ["No High Court entries in this edition.", "इस संस्करण में उच्च न्यायालयों की कोई प्रविष्टि नहीं है।", "या आवृत्तीत उच्च न्यायालयांची एकही नोंद नाही."],
  ["No district court rulings were reported in this edition.", "इस संस्करण में ज़िला न्यायालयों का कोई निर्णय प्रकाशित नहीं हुआ।", "या आवृत्तीत जिल्हा न्यायालयांचा एकही निकाल प्रसिद्ध झाला नाही."],
  ["No tribunal orders were reported in this edition.", "इस संस्करण में न्यायाधिकरणों का कोई आदेश प्रकाशित नहीं हुआ।", "या आवृत्तीत न्यायाधिकरणांचा एकही आदेश प्रसिद्ध झाला नाही."],
  ["No news items in this edition.", "इस संस्करण में कोई समाचार नहीं है।", "या आवृत्तीत एकही बातमी नाही."],
  ["No matches in the latest edition.", "नवीनतम संस्करण में कोई परिणाम नहीं मिला।", "नवीन आवृत्तीत काहीही सापडले नाही."],
  ["No matches in earlier editions.", "पिछले संस्करणों में कोई परिणाम नहीं मिला।", "मागील आवृत्त्यांमध्ये काहीही सापडले नाही."],
  ["No matches", "कोई परिणाम नहीं मिला", "काहीही सापडले नाही"],
  ["Loading the latest edition…", "नवीनतम संस्करण लोड हो रहा है…", "नवीन आवृत्ती लोड होत आहे…"],
  ["This section could not be loaded right now. Please refresh the page.", "यह भाग अभी लोड नहीं हो सका। कृपया पेज रीफ़्रेश करें।", "हा विभाग आत्ता लोड होऊ शकला नाही. कृपया पान रिफ्रेश करा."],
  ["All High Courts", "सभी उच्च न्यायालय", "सर्व उच्च न्यायालये"],
  ["All tribunals", "सभी न्यायाधिकरण", "सर्व न्यायाधिकरणे"],
  ["Filter by High Court", "उच्च न्यायालय के अनुसार छाँटें", "उच्च न्यायालयानुसार निवडा"],
  ["Filter by tribunal", "न्यायाधिकरण के अनुसार छाँटें", "न्यायाधिकरणानुसार निवडा"],
  ["Filter by court", "न्यायालय के अनुसार छाँटें", "न्यायालयानुसार निवडा"],
  ["Filter by subject", "विषय के अनुसार छाँटें", "विषयानुसार निवडा"],
  ["Filter", "छाँटें", "निवडा"],
  ["See all landmark judgments →", "सभी ऐतिहासिक निर्णय देखें →", "सर्व ऐतिहासिक निकाल पाहा →"],
  ["Read full judgment", "पूरा निर्णय पढ़ें", "संपूर्ण निकाल वाचा"],

  // kinds of ruling (approved list)
  ["Held", "निर्णय दिया", "निकाल दिला"],
  ["Pending", "लंबित", "प्रलंबित"],
  ["Reserved", "निर्णय सुरक्षित", "निकाल राखून ठेवला"],
  ["Split", "विभाजित निर्णय", "विभाजित निकाल"],
  ["Referred", "बड़ी पीठ को भेजा", "मोठ्या खंडपीठाकडे पाठवले"],

  // legal news
  ["Legal news · twice daily", "कानूनी समाचार · दिन में दो बार", "कायदेविषयक बातम्या · दिवसातून दोनदा"],
  ["Law news from across India: the judiciary, Bar Councils, Parliament and State Legislatures, and the Government. The 10 AM edition covers 4 PM the previous day to 10 AM; the 6 PM edition covers 10 AM to 4 PM. Latest edition first; earlier editions and search below.", "पूरे भारत से कानूनी समाचार: न्यायपालिका, बार काउंसिल, संसद और राज्य विधानमंडल, और सरकार। सुबह 10 बजे का संस्करण पिछले दिन शाम 4 बजे से सुबह 10 बजे तक के समाचार देता है; शाम 6 बजे का संस्करण सुबह 10 से शाम 4 बजे तक के। नवीनतम संस्करण सबसे पहले; पिछले संस्करण और खोज नीचे।", "देशभरातील कायदेविषयक बातम्या: न्यायव्यवस्था, बार कौन्सिल, संसद व राज्य विधिमंडळे, आणि शासन. सकाळी 10 ची आवृत्ती आदल्या दिवशी दुपारी 4 ते सकाळी 10 पर्यंतच्या बातम्या देते; संध्याकाळी 6 ची आवृत्ती सकाळी 10 ते दुपारी 4 पर्यंतच्या. नवीन आवृत्ती सर्वप्रथम; मागील आवृत्त्या व शोध खाली."],
  ["Latest editions (10 AM & 6 PM)", "नवीनतम संस्करण (सुबह 10 और शाम 6 बजे)", "नवीन आवृत्त्या (सकाळी 10 व संध्याकाळी 6)"],
  ["News Archive: 2021 to today →", "समाचार संग्रह: 2021 से आज तक →", "बातम्यांचा संग्रह: 2021 पासून आजपर्यंत →"],
  ["News Archive", "समाचार संग्रह", "बातम्यांचा संग्रह"],
  ["All news", "सभी समाचार", "सर्व बातम्या"],
  ["Filter news", "समाचार छाँटें", "बातम्या निवडा"],
  ["The first Legal News edition will appear here at the next update (10 AM or 6 PM IST).", "पहला कानूनी समाचार संस्करण अगले अपडेट (सुबह 10 या शाम 6 बजे IST) पर यहाँ दिखेगा।", "पहिली कायदेविषयक बातम्यांची आवृत्ती पुढील अद्यतनावेळी (सकाळी 10 किंवा संध्याकाळी 6, IST) येथे दिसेल."],
  ["Legal news · 2021 to today", "कानूनी समाचार · 2021 से आज तक", "कायदेविषयक बातम्या · 2021 पासून आजपर्यंत"],
  ["The biggest legal news of every month since October 2021: the judiciary, Bar Councils, Parliament and State Legislatures, and the Government, from across India. Pick a year or category, or search.", "अक्टूबर 2021 से हर महीने के सबसे बड़े कानूनी समाचार: पूरे भारत से न्यायपालिका, बार काउंसिल, संसद और राज्य विधानमंडल, और सरकार। कोई वर्ष या श्रेणी चुनें, या खोजें।", "ऑक्टोबर 2021 पासून प्रत्येक महिन्यातील सर्वांत मोठ्या कायदेविषयक बातम्या: देशभरातील न्यायव्यवस्था, बार कौन्सिल, संसद व राज्य विधिमंडळे, आणि शासन. वर्ष किंवा श्रेणी निवडा, किंवा शोधा."],
  ["Search 5 years of legal news", "5 वर्षों के कानूनी समाचारों में खोजें", "5 वर्षांच्या कायदेविषयक बातम्यांमध्ये शोधा"],
  ["All years", "सभी वर्ष", "सर्व वर्षे"],
  ["All categories", "सभी श्रेणियाँ", "सर्व श्रेणी"],
  ["Year", "वर्ष", "वर्ष"],
  ["Category", "श्रेणी", "श्रेणी"],
  ["Loading the news archive…", "समाचार संग्रह लोड हो रहा है…", "बातम्यांचा संग्रह लोड होत आहे…"],
  ["The news archive is being prepared and will appear here soon.", "समाचार संग्रह तैयार किया जा रहा है और जल्द ही यहाँ दिखेगा।", "बातम्यांचा संग्रह तयार होत असून लवकरच येथे दिसेल."],
  ["No stories match your search.", "आपकी खोज से कोई समाचार मेल नहीं खाता।", "तुमच्या शोधाशी जुळणारी एकही बातमी नाही."],
  ["Every story links to the legal publication or official website it was taken from. Stories are summaries; follow the link for the full report.", "हर समाचार उस कानूनी प्रकाशन या आधिकारिक वेबसाइट से जुड़ा है जहाँ से वह लिया गया है। ये सारांश हैं; पूरी रिपोर्ट के लिए लिंक खोलें।", "प्रत्येक बातमी ज्या कायदेविषयक प्रकाशनातून किंवा अधिकृत वेबसाइटवरून घेतली आहे, त्याच्याशी जोडलेली आहे. हे सारांश आहेत; संपूर्ण वृत्तासाठी लिंक उघडा."],
  ["Judiciary", "न्यायपालिका", "न्यायव्यवस्था"],
  ["Bar & Bar Councils", "बार एवं बार काउंसिल", "बार व बार कौन्सिल"],
  ["Legislature", "विधायिका", "विधिमंडळ"],
  ["Executive & Government", "कार्यपालिका एवं सरकार", "कार्यकारी यंत्रणा व शासन"],
  ["Legal Education & Careers", "कानूनी शिक्षा एवं करियर", "कायदेविषयक शिक्षण व करिअर"],
  ["Other Legal News", "अन्य कानूनी समाचार", "इतर कायदेविषयक बातम्या"],
  ["All India", "अखिल भारतीय", "अखिल भारतीय"],
  ["Morning edition", "सुबह का संस्करण", "सकाळची आवृत्ती"],
  ["Evening edition", "शाम का संस्करण", "संध्याकाळची आवृत्ती"],

  // landmarks
  ["The Library", "संग्रह", "संग्रह"],
  ["Landmark decisions of the Supreme Court, High Courts, trial courts and tribunals, arranged by decade. Each has its case name, citation, case number where available, the bench, the date and a link to the full text.", "सर्वोच्च न्यायालय, उच्च न्यायालयों, विचारण न्यायालयों और न्यायाधिकरणों के ऐतिहासिक निर्णय, दशक के अनुसार। हर निर्णय के साथ मामले का नाम, साइटेशन, उपलब्ध होने पर मामला संख्या, पीठ, तिथि और पूरे पाठ का लिंक है।", "सर्वोच्च न्यायालय, उच्च न्यायालये, कनिष्ठ न्यायालये व न्यायाधिकरणांचे ऐतिहासिक निकाल, दशकानुसार मांडलेले. प्रत्येक निकालासोबत प्रकरणाचे नाव, साइटेशन, उपलब्ध असल्यास प्रकरण क्रमांक, खंडपीठ, तारीख आणि संपूर्ण मजकुराची लिंक आहे."],
  ["judgments", "निर्णय", "निकाल"],
  ["years", "वर्ष", "वर्षे"],
  ["court levels", "न्यायालय स्तर", "न्यायालय स्तर"],
  ["All courts", "सभी न्यायालय", "सर्व न्यायालये"],
  ["All subjects", "सभी विषय", "सर्व विषय"],
  ["★ Essential reading", "★ अवश्य पढ़ें", "★ अवश्य वाचा"],
  ["Single judge", "एकल न्यायाधीश", "एकल न्यायाधीश"],
  ["Official text being added", "आधिकारिक पाठ जोड़ा जा रहा है", "अधिकृत मजकूर जोडला जात आहे"],
  ["Read judgment · Indian Kanoon", "निर्णय पढ़ें · Indian Kanoon", "निकाल वाचा · Indian Kanoon"],
  ["Search case, citation, year", "मामला, साइटेशन, वर्ष खोजें", "प्रकरण, साइटेशन, वर्ष शोधा"],
  ["Search landmark judgments", "ऐतिहासिक निर्णय खोजें", "ऐतिहासिक निकाल शोधा"],
  ["No landmark judgments match these filters.", "इन चयनों से कोई ऐतिहासिक निर्णय मेल नहीं खाता।", "या निवडींशी जुळणारा एकही ऐतिहासिक निकाल नाही."],
  ["Tap to reverse the order", "क्रम उलटने के लिए टैप करें", "क्रम उलटण्यासाठी टॅप करा"],
  ["⇅ Oldest first", "⇅ पुराने पहले", "⇅ जुने आधी"],
  ["⇅ Newest first", "⇅ नए पहले", "⇅ नवीन आधी"],
  ["Reverse the order: show newest judgments first", "क्रम उलटें: नए निर्णय पहले दिखाएँ", "क्रम उलटा: नवीन निकाल आधी दाखवा"],
  ["Reverse the order: show oldest judgments first", "क्रम उलटें: पुराने निर्णय पहले दिखाएँ", "क्रम उलटा: जुने निकाल आधी दाखवा"],
  ["Citations and case numbers are as printed in the reported judgments. Full texts link to Indian Kanoon, a free legal database; two entries link to a Government of India release (PIB) or to Supreme Court Observer. The official copies are on the Supreme Court's website (sci.gov.in) and in the eCourts judgment search (judgments.ecourts.gov.in). Notes flag judgments that were later overruled, reversed or referred to a larger bench. Always check later developments before citing a case.", "साइटेशन और मामला संख्या वैसे ही दी गई हैं जैसे प्रकाशित निर्णयों में छपी हैं। पूरे पाठ के लिंक Indian Kanoon (एक निःशुल्क कानूनी डेटाबेस) पर जाते हैं; दो प्रविष्टियाँ भारत सरकार की विज्ञप्ति (PIB) या Supreme Court Observer से जुड़ी हैं। आधिकारिक प्रतियाँ सर्वोच्च न्यायालय की वेबसाइट (sci.gov.in) और eCourts निर्णय खोज (judgments.ecourts.gov.in) पर हैं। टिप्पणियाँ बताती हैं कि कौन से निर्णय बाद में पलटे गए, उलटे गए या बड़ी पीठ को भेजे गए। किसी मामले का हवाला देने से पहले बाद के घटनाक्रम अवश्य देखें।", "साइटेशन व प्रकरण क्रमांक प्रसिद्ध निकालांमध्ये छापल्याप्रमाणे दिले आहेत. संपूर्ण मजकुराच्या लिंक Indian Kanoon (एक मोफत कायदेविषयक डेटाबेस) वर जातात; दोन नोंदी भारत सरकारच्या प्रसिद्धीपत्रकाशी (PIB) किंवा Supreme Court Observer शी जोडलेल्या आहेत. अधिकृत प्रती सर्वोच्च न्यायालयाच्या वेबसाइटवर (sci.gov.in) आणि eCourts निकाल शोधात (judgments.ecourts.gov.in) आहेत. टिपा सांगतात की कोणते निकाल नंतर उलटवले गेले, बदलले गेले किंवा मोठ्या खंडपीठाकडे पाठवले गेले. एखाद्या प्रकरणाचा संदर्भ देण्यापूर्वी नंतरच्या घडामोडी नक्की तपासा."],
  ["From the Landmark Library · Supreme Court", "ऐतिहासिक निर्णय संग्रह से · सर्वोच्च न्यायालय", "ऐतिहासिक निकाल संग्रहातून · सर्वोच्च न्यायालय"],
  ["Constitution & Basic Structure", "संविधान एवं मूल ढाँचा", "संविधान व मूलभूत संरचना"],
  ["Life & Personal Liberty", "जीवन एवं व्यक्तिगत स्वतंत्रता", "जीवन व वैयक्तिक स्वातंत्र्य"],
  ["Right to Life & Dignity", "जीवन और गरिमा का अधिकार", "जीवन व प्रतिष्ठेचा हक्क"],
  ["Privacy", "निजता", "खासगीपणा"],
  ["Equality & Reservation", "समानता एवं आरक्षण", "समानता व आरक्षण"],
  ["Gender Justice", "लैंगिक न्याय", "लिंगभाव न्याय"],
  ["Speech & Internet", "अभिव्यक्ति एवं इंटरनेट", "अभिव्यक्ती व इंटरनेट"],
  ["Environment", "पर्यावरण", "पर्यावरण"],
  ["Elections & Democracy", "चुनाव एवं लोकतंत्र", "निवडणुका व लोकशाही"],
  ["Judicial Appointments", "न्यायिक नियुक्तियाँ", "न्यायिक नियुक्त्या"],
  ["Family & Personal Law", "परिवार एवं व्यक्तिगत कानून", "कुटुंब व वैयक्तिक कायदा"],
  ["Education", "शिक्षा", "शिक्षण"],
  ["Religion & Faith", "धर्म एवं आस्था", "धर्म व श्रद्धा"],
  ["Federalism", "संघवाद", "संघराज्यवाद"],
  ["Arbitration & Commerce", "मध्यस्थता एवं वाणिज्य", "लवाद व वाणिज्य"],
  ["Criminal Justice", "आपराधिक न्याय", "फौजदारी न्याय"],
  ["Sessions Court, Saket (Delhi)", "सत्र न्यायालय, साकेत (दिल्ली)", "सत्र न्यायालय, साकेत (दिल्ली)"],
  ["Special CBI Court, Patiala House (Delhi)", "विशेष सीबीआई न्यायालय, पटियाला हाउस (दिल्ली)", "विशेष सीबीआय न्यायालय, पतियाळा हाऊस (दिल्ली)"],
  ["National Green Tribunal", "राष्ट्रीय हरित अधिकरण", "राष्ट्रीय हरित न्यायाधिकरण"],
  ["NCLAT, New Delhi", "NCLAT, नई दिल्ली", "NCLAT, नवी दिल्ली"],
  ["Competition Commission of India", "भारतीय प्रतिस्पर्धा आयोग", "भारतीय स्पर्धा आयोग"],

  // full judgments library and reader
  ["Supreme Court of India · Official texts", "भारत का सर्वोच्च न्यायालय · आधिकारिक पाठ", "भारताचे सर्वोच्च न्यायालय · अधिकृत मजकूर"],
  ["The complete text of Supreme Court judgments, read right here on Nirnay Daily. Every text comes from the Supreme Court's own copy of the judgment. Search inside any judgment, jump to a page, or switch between clean paragraphs and the original line breaks.", "सर्वोच्च न्यायालय के निर्णयों का पूरा पाठ, यहीं Nirnay Daily पर पढ़ें। हर पाठ सर्वोच्च न्यायालय की अपनी प्रति से लिया गया है। किसी भी निर्णय के अंदर खोजें, किसी पृष्ठ पर जाएँ, या साफ़ अनुच्छेदों और मूल पंक्ति-विभाजन के बीच बदलें।", "सर्वोच्च न्यायालयाच्या निकालांचा संपूर्ण मजकूर, इथेच Nirnay Daily वर वाचा. प्रत्येक मजकूर सर्वोच्च न्यायालयाच्या स्वतःच्या प्रतीतून घेतला आहे. कोणत्याही निकालात शोधा, एखाद्या पानावर जा, किंवा स्वच्छ परिच्छेद व मूळ ओळी यांमध्ये बदल करा."],
  ["pages", "पृष्ठ", "पाने"],
  ["added daily", "रोज़ जोड़े गए", "दररोज जोडलेले"],
  ["All", "सभी", "सर्व"],
  ["Landmark judgments", "ऐतिहासिक निर्णय", "ऐतिहासिक निकाल"],
  ["From the daily digest", "दैनिक सार से", "दैनंदिन सारांशातून"],
  ["Search case name, citation, year", "मामले का नाम, साइटेशन, वर्ष खोजें", "प्रकरणाचे नाव, साइटेशन, वर्ष शोधा"],
  ["Search full judgments", "संपूर्ण निर्णय खोजें", "संपूर्ण निकालपत्रे शोधा"],
  ["No judgments match your search.", "आपकी खोज से कोई निर्णय मेल नहीं खाता।", "तुमच्या शोधाशी जुळणारा एकही निकाल नाही."],
  ["daily digest", "दैनिक सार", "दैनंदिन सारांश"],
  ["scanned original", "स्कैन की गई मूल प्रति", "स्कॅन केलेली मूळ प्रत"],
  ["Texts are taken word for word from the Supreme Court of India's official copies (its judgment archive and Supreme Court Reports). Older archive texts can contain typing errors that are also present in the official copy. For citation, check against the certified copy.", "पाठ भारत के सर्वोच्च न्यायालय की आधिकारिक प्रतियों (उसके निर्णय संग्रह और Supreme Court Reports) से शब्दशः लिए गए हैं। पुराने संग्रह के पाठों में टंकण की वे गलतियाँ हो सकती हैं जो आधिकारिक प्रति में भी हैं। हवाला देने के लिए प्रमाणित प्रति से मिलान करें।", "मजकूर भारताच्या सर्वोच्च न्यायालयाच्या अधिकृत प्रतींमधून (निकाल संग्रह व Supreme Court Reports) शब्दशः घेतला आहे. जुन्या संग्रहातील मजकुरात अधिकृत प्रतीतही असलेल्या टंकलेखनाच्या चुका असू शकतात. संदर्भ देण्यासाठी प्रमाणित प्रतीशी पडताळा."],
  ["This judgment is not in the library yet.", "यह निर्णय अभी संग्रह में नहीं है।", "हा निकाल अद्याप संग्रहात नाही."],
  ["Browse all full judgments", "सभी संपूर्ण निर्णय देखें", "सर्व संपूर्ण निकालपत्रे पाहा"],
  ["← Back", "← वापस", "← मागे"],
  ["Supreme Court of India · Full judgment", "भारत का सर्वोच्च न्यायालय · संपूर्ण निर्णय", "भारताचे सर्वोच्च न्यायालय · संपूर्ण निकालपत्र"],
  ["Official text of the Supreme Court of India", "भारत के सर्वोच्च न्यायालय का आधिकारिक पाठ", "भारताच्या सर्वोच्च न्यायालयाचा अधिकृत मजकूर"],
  ["⬇ Download PDF", "⬇ PDF डाउनलोड करें", "⬇ PDF डाउनलोड करा"],
  ["⬇ PDF", "⬇ PDF", "⬇ PDF"],
  ["Official signed copy", "आधिकारिक हस्ताक्षरित प्रति", "अधिकृत स्वाक्षरीत प्रत"],
  ["Scanned original", "स्कैन की गई मूल प्रति", "स्कॅन केलेली मूळ प्रत"],
  ["Full text, page by page", "पूरा पाठ, पृष्ठ-दर-पृष्ठ", "संपूर्ण मजकूर, पानानुसार"],
  ["Full text", "पूरा पाठ", "संपूर्ण मजकूर"],
  ["Reader tools", "पढ़ने के साधन", "वाचनासाठी साधने"],
  ["Find in this judgment", "इस निर्णय में खोजें", "या निकालात शोधा"],
  ["Find a section or word", "कोई धारा या शब्द खोजें", "एखादे कलम किंवा शब्द शोधा"],
  ["Find in this Act", "इस अधिनियम में खोजें", "या अधिनियमात शोधा"],
  ["Previous match", "पिछला परिणाम", "मागील परिणाम"],
  ["Next match", "अगला परिणाम", "पुढील परिणाम"],
  ["Go to page", "पृष्ठ पर जाएँ", "पानावर जा"],
  ["Go to page…", "पृष्ठ पर जाएँ…", "पानावर जा…"],
  ["Original line breaks", "मूल पंक्ति-विभाजन", "मूळ ओळी"],
  ["Smaller text", "छोटे अक्षर", "लहान अक्षरे"],
  ["Larger text", "बड़े अक्षर", "मोठी अक्षरे"],
  ["Loading the full judgment…", "पूरा निर्णय लोड हो रहा है…", "संपूर्ण निकाल लोड होत आहे…"],
  ["Loading the scanned judgment…", "स्कैन किया गया निर्णय लोड हो रहा है…", "स्कॅन केलेला निकाल लोड होत आहे…"],
  ["Loading the Act…", "अधिनियम लोड हो रहा है…", "अधिनियम लोड होत आहे…"],
  ["This text could not be loaded. Please refresh the page.", "यह पाठ लोड नहीं हो सका। कृपया पेज रीफ़्रेश करें।", "हा मजकूर लोड होऊ शकला नाही. कृपया पान रिफ्रेश करा."],
  ["The scanned judgment could not be displayed. Please refresh the page.", "स्कैन किया गया निर्णय दिखाया नहीं जा सका। कृपया पेज रीफ़्रेश करें।", "स्कॅन केलेला निकाल दाखवता आला नाही. कृपया पान रिफ्रेश करा."],

  // bare acts
  ["Official texts · Latest versions", "आधिकारिक पाठ · नवीनतम संस्करण", "अधिकृत मजकूर · नवीन आवृत्त्या"],
  ["Central Acts", "केंद्रीय अधिनियम", "केंद्रीय अधिनियम"],
  ["Maharashtra Acts", "महाराष्ट्र के अधिनियम", "महाराष्ट्राचे अधिनियम"],
  ["Madhya Pradesh Acts", "मध्य प्रदेश के अधिनियम", "मध्य प्रदेशाचे अधिनियम"],
  ["Rajasthan Acts", "राजस्थान के अधिनियम", "राजस्थानचे अधिनियम"],
  ["Chhattisgarh Acts", "छत्तीसगढ़ के अधिनियम", "छत्तीसगडचे अधिनियम"],
  ["Central & Maharashtra", "केंद्रीय एवं महाराष्ट्र", "केंद्रीय व महाराष्ट्र"],
  ["Parliament of India", "भारत की संसद", "भारताची संसद"],
  ["Maharashtra State Legislature", "महाराष्ट्र राज्य विधानमंडल", "महाराष्ट्र राज्य विधिमंडळ"],
  ["Madhya Pradesh Legislature", "मध्य प्रदेश विधानमंडल", "मध्य प्रदेश विधिमंडळ"],
  ["Rajasthan Legislature", "राजस्थान विधानमंडल", "राजस्थान विधिमंडळ"],
  ["Chhattisgarh Legislature", "छत्तीसगढ़ विधानमंडल", "छत्तीसगड विधिमंडळ"],
  ["Central Act", "केंद्रीय अधिनियम", "केंद्रीय अधिनियम"],
  ["Maharashtra State Act", "महाराष्ट्र राज्य अधिनियम", "महाराष्ट्र राज्य अधिनियम"],
  ["Madhya Pradesh State Act", "मध्य प्रदेश राज्य अधिनियम", "मध्य प्रदेश राज्य अधिनियम"],
  ["Rajasthan State Act", "राजस्थान राज्य अधिनियम", "राजस्थान राज्य अधिनियम"],
  ["Chhattisgarh State Act", "छत्तीसगढ़ राज्य अधिनियम", "छत्तीसगड राज्य अधिनियम"],
  ["Bare Act", "अधिनियम (मूल पाठ)", "अधिनियम (मूळ पाठ)"],
  ["Read the Act", "अधिनियम पढ़ें", "अधिनियम वाचा"],
  ["Read the Act · PDF", "अधिनियम पढ़ें · PDF", "अधिनियम वाचा · PDF"],
  ["View the Act", "अधिनियम देखें", "अधिनियम पाहा"],
  ["Official PDF", "आधिकारिक PDF", "अधिकृत PDF"],
  ["⬇ Official PDF", "⬇ आधिकारिक PDF", "⬇ अधिकृत PDF"],
  ["Open the official PDF", "आधिकारिक PDF खोलें", "अधिकृत PDF उघडा"],
  ["⬇ Download the official PDF", "⬇ आधिकारिक PDF डाउनलोड करें", "⬇ अधिकृत PDF डाउनलोड करा"],
  ["View on India Code", "India Code पर देखें", "India Code वर पाहा"],
  ["Replaced:", "निरस्त किया:", "रद्द केले:"],
  ["This Act replaced:", "इस अधिनियम ने इन्हें निरस्त किया:", "या अधिनियमाने हे रद्द केले:"],
  ["← All Bare Acts", "← सभी अधिनियम", "← सर्व अधिनियम"],
  ["Choose Central or State Acts", "केंद्रीय या राज्य अधिनियम चुनें", "केंद्रीय किंवा राज्य अधिनियम निवडा"],
  ["Search Act name, number, year", "अधिनियम का नाम, संख्या, वर्ष खोजें", "अधिनियमाचे नाव, क्रमांक, वर्ष शोधा"],
  ["Search bare acts", "अधिनियम खोजें", "अधिनियम शोधा"],
  ["No Acts match your search.", "आपकी खोज से कोई अधिनियम मेल नहीं खाता।", "तुमच्या शोधाशी जुळणारा एकही अधिनियम नाही."],
  ["This Act is not in the collection yet.", "यह अधिनियम अभी संग्रह में नहीं है।", "हा अधिनियम अद्याप संग्रहात नाही."],
  ["Browse all Bare Acts", "सभी अधिनियम देखें", "सर्व अधिनियम पाहा"],
  ["Official text from India Code, Government of India", "India Code (भारत सरकार) से आधिकारिक पाठ", "India Code (भारत सरकार) कडील अधिकृत मजकूर"],
  ["India Code has not published a PDF of this Act yet.", "India Code ने अभी इस अधिनियम का PDF प्रकाशित नहीं किया है।", "India Code ने अद्याप या अधिनियमाचा PDF प्रसिद्ध केलेला नाही."],
  ["The official copy of this Act is in Hindi.", "इस अधिनियम की आधिकारिक प्रति हिन्दी में है।", "या अधिनियमाची अधिकृत प्रत हिंदीत आहे."],
  ["The official copy of this Act is a scanned or image-based PDF.", "इस अधिनियम की आधिकारिक प्रति स्कैन की गई या चित्र-आधारित PDF है।", "या अधिनियमाची अधिकृत प्रत स्कॅन केलेली किंवा चित्र-आधारित PDF आहे."],
  ["Open its India Code page above to check for the official text.", "आधिकारिक पाठ के लिए ऊपर इसका India Code पृष्ठ खोलें।", "अधिकृत मजकुरासाठी वरील India Code पान उघडा."],
  ["The current text of India's principal Acts and of Maharashtra's State Acts, as published by the Government on India Code and kept to the latest version in force. Where a new law has replaced an old one, only the new law is given, for example the Bharatiya Nyaya Sanhita, 2023 in place of the Indian Penal Code. State Acts of Madhya Pradesh, Rajasthan and Chhattisgarh are under their own tabs below.", "भारत के प्रमुख अधिनियमों और महाराष्ट्र के राज्य अधिनियमों का वर्तमान पाठ, जैसा सरकार ने India Code पर प्रकाशित किया है, नवीनतम लागू संस्करण के अनुसार। जहाँ नए कानून ने पुराने को निरस्त किया है, वहाँ केवल नया कानून दिया गया है, जैसे भारतीय दंड संहिता के स्थान पर भारतीय न्याय संहिता, 2023। मध्य प्रदेश, राजस्थान और छत्तीसगढ़ के राज्य अधिनियम नीचे उनके अपने टैब में हैं।", "भारताचे प्रमुख अधिनियम आणि महाराष्ट्राचे राज्य अधिनियम यांचा सध्याचा मजकूर, शासनाने India Code वर प्रसिद्ध केल्याप्रमाणे, नवीन लागू आवृत्तीनुसार. जेथे नवीन कायद्याने जुना कायदा रद्द केला आहे, तेथे फक्त नवीन कायदा दिला आहे, उदा. भारतीय दंड संहितेऐवजी भारतीय न्याय संहिता, 2023. मध्य प्रदेश, राजस्थान व छत्तीसगडचे राज्य अधिनियम खाली त्यांच्या स्वतंत्र टॅबमध्ये आहेत."],
  ["The current text of Maharashtra's principal State Acts, as published by the Government on India Code, the official repository of Central and State Acts. Each Act has its full text, search, and the official PDF.", "महाराष्ट्र के प्रमुख राज्य अधिनियमों का वर्तमान पाठ, जैसा सरकार ने केंद्रीय और राज्य अधिनियमों के आधिकारिक भंडार India Code पर प्रकाशित किया है। हर अधिनियम का पूरा पाठ, खोज और आधिकारिक PDF उपलब्ध है।", "महाराष्ट्राच्या प्रमुख राज्य अधिनियमांचा सध्याचा मजकूर, शासनाने केंद्रीय व राज्य अधिनियमांच्या अधिकृत भांडार India Code वर प्रसिद्ध केल्याप्रमाणे. प्रत्येक अधिनियमाचा संपूर्ण मजकूर, शोध आणि अधिकृत PDF उपलब्ध आहे."],
  ["The current text of India's principal Acts, as published by the Government on India Code and kept to the latest version in force. Where a new law has replaced an old one, only the new law is given, for example the Bharatiya Nyaya Sanhita, 2023 in place of the Indian Penal Code.", "भारत के प्रमुख अधिनियमों का वर्तमान पाठ, जैसा सरकार ने India Code पर प्रकाशित किया है, नवीनतम लागू संस्करण के अनुसार। जहाँ नए कानून ने पुराने को निरस्त किया है, वहाँ केवल नया कानून दिया गया है, जैसे भारतीय दंड संहिता के स्थान पर भारतीय न्याय संहिता, 2023।", "भारताच्या प्रमुख अधिनियमांचा सध्याचा मजकूर, शासनाने India Code वर प्रसिद्ध केल्याप्रमाणे, नवीन लागू आवृत्तीनुसार. जेथे नवीन कायद्याने जुना कायदा रद्द केला आहे, तेथे फक्त नवीन कायदा दिला आहे, उदा. भारतीय दंड संहितेऐवजी भारतीय न्याय संहिता, 2023."],
  ["हिन्दी", "हिन्दी", "हिंदी"],

  // careers
  ["Build your career in law", "कानून में अपना करियर बनाएँ", "कायद्यात तुमचे करिअर घडवा"],
  ["Only opportunities that are open or about to open are shown. Listings disappear on their own once the last date passes, and new judiciary posts, jobs, internships, entrance tests and admissions are added as they are notified.", "केवल वही अवसर दिखाए जाते हैं जो खुले हैं या जल्द खुलने वाले हैं। अंतिम तिथि बीतते ही सूचनाएँ अपने-आप हट जाती हैं, और नए न्यायिक पद, नौकरियाँ, इंटर्नशिप, प्रवेश परीक्षाएँ और प्रवेश अधिसूचित होते ही जोड़े जाते हैं।", "फक्त सुरू असलेल्या किंवा लवकरच सुरू होणाऱ्या संधी दाखवल्या जातात. शेवटची तारीख उलटताच माहिती आपोआप निघून जाते, आणि नवीन न्यायिक पदे, नोकऱ्या, इंटर्नशिप, प्रवेश परीक्षा व प्रवेश अधिसूचित होताच जोडले जातात."],
  ["Search openings, organisations, courses", "अवसर, संस्थाएँ, पाठ्यक्रम खोजें", "संधी, संस्था, अभ्यासक्रम शोधा"],
  ["open or upcoming", "खुले या आने वाले", "सुरू किंवा येणाऱ्या"],
  ["Show all", "सभी दिखाएँ", "सर्व दाखवा"],
  ["closing within 7 days", "7 दिनों में बंद होंगे", "7 दिवसांत बंद होणार"],
  ["See what closes when →", "देखें कौन कब बंद होगा →", "कोणते केव्हा बंद होणार ते पाहा →"],
  ["See every opening sorted by when it closes", "सभी अवसर उनके बंद होने की तिथि के क्रम में देखें", "सर्व संधी बंद होण्याच्या तारखेनुसार पाहा"],
  ["last checked", "अंतिम जाँच", "शेवटची पडताळणी"],
  ["All open", "सभी खुले", "सर्व सुरू"],
  ["⏳ By last date", "⏳ अंतिम तिथि के अनुसार", "⏳ शेवटच्या तारखेनुसार"],
  ["Filter openings", "अवसर छाँटें", "संधी निवडा"],
  ["Closing soon", "जल्द बंद होगा", "लवकरच बंद होणार"],
  ["Open", "आवेदन खुले", "अर्ज सुरू"],
  ["Awaited", "प्रतीक्षित", "प्रतीक्षेत"],
  ["Closed", "बंद", "बंद"],
  ["Government", "सरकारी", "सरकारी"],
  ["private", "निजी", "खासगी"],
  ["Private", "निजी", "खासगी"],
  ["Fellowship", "फ़ेलोशिप", "फेलोशिप"],
  ["Closes today", "आज अंतिम दिन", "आज शेवटचा दिवस"],
  ["Closing in 1–3 days", "1–3 दिनों में बंद", "1–3 दिवसांत बंद"],
  ["Closing in 4–7 days", "4–7 दिनों में बंद", "4–7 दिवसांत बंद"],
  ["Closing in 8–15 days", "8–15 दिनों में बंद", "8–15 दिवसांत बंद"],
  ["Closing in 16–30 days", "16–30 दिनों में बंद", "16–30 दिवसांत बंद"],
  ["Closing after 30 days", "30 दिनों के बाद बंद", "30 दिवसांनंतर बंद"],
  ["Last date not announced yet", "अंतिम तिथि अभी घोषित नहीं", "शेवटची तारीख अद्याप जाहीर नाही"],
  ["No open listings in this section right now. New ones are added as soon as they are notified.", "इस भाग में अभी कोई खुला अवसर नहीं है। नए अवसर अधिसूचित होते ही जोड़े जाते हैं।", "या विभागात सध्या एकही सुरू संधी नाही. नवीन संधी अधिसूचित होताच जोडल्या जातात."],
  ["No listings match your search.", "आपकी खोज से कोई अवसर मेल नहीं खाता।", "तुमच्या शोधाशी जुळणारी एकही संधी नाही."],
  ["Every listing links to the recruiting body's official website, where dates, fees and eligibility were read. Always confirm there before applying.", "हर सूचना भर्ती करने वाली संस्था की आधिकारिक वेबसाइट से जुड़ी है, जहाँ से तिथियाँ, शुल्क और पात्रता पढ़ी गई थीं। आवेदन से पहले वहाँ अवश्य पुष्टि करें।", "प्रत्येक माहिती भरती करणाऱ्या संस्थेच्या अधिकृत वेबसाइटशी जोडलेली आहे, जिथून तारखा, शुल्क व पात्रता घेतल्या आहेत. अर्ज करण्यापूर्वी तेथे नक्की खात्री करा."],
  ["official site ↗", "आधिकारिक वेबसाइट ↗", "अधिकृत वेबसाइट ↗"],
  ["Judicial Services & Judiciary", "न्यायिक सेवा एवं न्यायपालिका", "न्यायिक सेवा व न्यायव्यवस्था"],
  ["Government Legal Jobs & Internships", "सरकारी कानूनी नौकरियाँ एवं इंटर्नशिप", "सरकारी कायदेविषयक नोकऱ्या व इंटर्नशिप"],
  ["Exams & Entrance Tests", "परीक्षाएँ एवं प्रवेश परीक्षाएँ", "परीक्षा व प्रवेश परीक्षा"],
  ["LLM Admissions: NLUs & Maharashtra", "एलएल.एम. प्रवेश: NLU एवं महाराष्ट्र", "एलएल.एम. प्रवेश: NLU व महाराष्ट्र"],
  ["Private Jobs, Fellowships & Internships", "निजी नौकरियाँ, फ़ेलोशिप एवं इंटर्नशिप", "खासगी नोकऱ्या, फेलोशिप व इंटर्नशिप"],
  ["Judge-track openings and court research roles. Research and clerkship posts are the best first step for fresh graduates aiming at the bench.", "न्यायाधीश बनने की राह वाले अवसर और न्यायालयों में शोध पद। न्यायपीठ का लक्ष्य रखने वाले नए स्नातकों के लिए शोध और लॉ क्लर्क पद सबसे अच्छा पहला कदम हैं।", "न्यायाधीश होण्याच्या मार्गावरील संधी आणि न्यायालयांतील संशोधन पदे. न्यायाधीश होण्याचे ध्येय असलेल्या नव्या पदवीधरांसाठी संशोधन व लॉ क्लर्क पदे हे सर्वोत्तम पहिले पाऊल आहे."],
  ["Government roles open to students and new graduates. Most PSU legal jobs hire through CLAT PG scores, so the exam page matters here too.", "छात्रों और नए स्नातकों के लिए खुले सरकारी पद। अधिकतर PSU कानूनी नौकरियाँ CLAT PG अंकों से भर्ती करती हैं, इसलिए यहाँ परीक्षा वाला पृष्ठ भी महत्वपूर्ण है।", "विद्यार्थी व नव्या पदवीधरांसाठी खुली सरकारी पदे. बहुतेक PSU कायदेविषयक नोकऱ्यांची भरती CLAT PG गुणांवर होते, त्यामुळे इथे परीक्षेचे पानही महत्त्वाचे आहे."],
  ["Qualifying and eligibility exams. LLM entrance tests (CLAT PG, AILET) are on the LLM Admissions page.", "अर्हता और पात्रता परीक्षाएँ। एलएल.एम. प्रवेश परीक्षाएँ (CLAT PG, AILET) एलएल.एम. प्रवेश पृष्ठ पर हैं।", "पात्रता परीक्षा. एलएल.एम. प्रवेश परीक्षा (CLAT PG, AILET) एलएल.एम. प्रवेश पानावर आहेत."],
  ["Where you can apply for an LLM starting in 2027. NLU seats open now through CLAT PG and AILET; Maharashtra's state and private colleges usually open later, so they are tracked here until their official notices appear.", "2027 से शुरू होने वाले एलएल.एम. के लिए आप कहाँ आवेदन कर सकते हैं। NLU की सीटें अभी CLAT PG और AILET से खुली हैं; महाराष्ट्र के राज्य और निजी कॉलेज आमतौर पर बाद में खुलते हैं, इसलिए उनकी आधिकारिक सूचना आने तक उन पर यहाँ नज़र रखी जाती है।", "2027 पासून सुरू होणाऱ्या एलएल.एम. साठी तुम्ही कुठे अर्ज करू शकता. NLU च्या जागा आत्ता CLAT PG व AILET मार्फत सुरू आहेत; महाराष्ट्रातील राज्य व खासगी महाविद्यालये सहसा नंतर सुरू होतात, म्हणून त्यांची अधिकृत सूचना येईपर्यंत त्यांचा मागोवा इथे घेतला जातो."],
  ["Private jobs, fellowships and internships, taken only from the employer's own website. Big firms do not always post fresher roles publicly, so their official application portals are listed below.", "निजी नौकरियाँ, फ़ेलोशिप और इंटर्नशिप, केवल नियोक्ता की अपनी वेबसाइट से ली गई। बड़ी फ़र्में नए स्नातकों के पद हमेशा सार्वजनिक रूप से नहीं डालतीं, इसलिए उनके आधिकारिक आवेदन पोर्टल नीचे दिए गए हैं।", "खासगी नोकऱ्या, फेलोशिप व इंटर्नशिप, फक्त नियोक्त्याच्या स्वतःच्या वेबसाइटवरून घेतलेल्या. मोठ्या फर्म नव्या पदवीधरांची पदे नेहमी जाहीर करत नाहीत, म्हणून त्यांची अधिकृत अर्ज पोर्टल्स खाली दिली आहेत."],
  ["Also open, but they need practice experience", "ये भी खुले हैं, पर इनके लिए वकालत का अनुभव चाहिए", "हेही सुरू आहेत, पण यासाठी वकिलीचा अनुभव हवा"],
  ["Apply directly on the firm's official careers portal", "सीधे फ़र्म के आधिकारिक करियर पोर्टल पर आवेदन करें", "थेट फर्मच्या अधिकृत करिअर पोर्टलवर अर्ज करा"],
  ["Last date", "अंतिम तिथि", "शेवटची तारीख"],
  ["Posts", "पद", "पदे"],
  ["Fee", "शुल्क", "शुल्क"],
  ["Pay", "वेतन", "वेतन"],
  ["Tenure", "कार्यकाल", "कार्यकाळ"],
  ["Posted", "तैनाती", "नियुक्तीचे ठिकाण"],
  ["Exam", "परीक्षा", "परीक्षा"],
  ["Status", "स्थिति", "स्थिती"],
  ["Advertised", "विज्ञापन तिथि", "जाहिरात दिनांक"],
  ["Stipend", "वज़ीफ़ा", "विद्यावेतन"],
  ["Based in", "स्थान", "ठिकाण"],
  ["Based at", "स्थान", "ठिकाण"],
  ["Registration", "पंजीकरण", "नोंदणी"],
  ["Apply from", "आवेदन शुरू", "अर्ज सुरू"],
  ["Notified", "अधिसूचित", "अधिसूचित"],
  ["Window", "आवेदन अवधि", "अर्ज कालावधी"],
  ["Interns", "इंटर्न", "इंटर्न"],
  ["Duration", "अवधि", "कालावधी"],
  ["Announced", "घोषित", "जाहीर"],
  ["Fee payment by", "शुल्क भुगतान की अंतिम तिथि", "शुल्क भरण्याची अंतिम तारीख"],
  ["Admit card", "प्रवेश पत्र", "प्रवेशपत्र"],
  ["Last cycle", "पिछला सत्र", "मागील सत्र"],
  ["Programme", "कार्यक्रम", "कार्यक्रम"],
  ["Fellowships", "फ़ेलोशिप", "फेलोशिप"],
  ["Term", "अवधि", "कालावधी"],
  ["Positions", "पद", "पदे"],
  ["Starts", "शुरुआत", "सुरुवात"],
  ["Eligibility", "पात्रता", "पात्रता"],
  ["Apply online", "ऑनलाइन आवेदन करें", "ऑनलाइन अर्ज करा"],
  ["Official notification", "आधिकारिक अधिसूचना", "अधिकृत अधिसूचना"],
  ["Official notification (PDF)", "आधिकारिक अधिसूचना (PDF)", "अधिकृत अधिसूचना (PDF)"],
  ["Official advertisement", "आधिकारिक विज्ञापन", "अधिकृत जाहिरात"],
  ["Recruitment page", "भर्ती पृष्ठ", "भरती पान"],
  ["Official internship page", "आधिकारिक इंटर्नशिप पृष्ठ", "अधिकृत इंटर्नशिप पान"],
  ["Official call for applications", "आवेदन के लिए आधिकारिक सूचना", "अर्जासाठी अधिकृत सूचना"],
  ["Official call", "आधिकारिक सूचना", "अधिकृत सूचना"],
  ["Announcement (PDF)", "घोषणा (PDF)", "घोषणा (PDF)"],
  ["Official LLM admissions page", "आधिकारिक एलएल.एम. प्रवेश पृष्ठ", "अधिकृत एलएल.एम. प्रवेश पान"],
  ["Official LLM portal", "आधिकारिक एलएल.एम. पोर्टल", "अधिकृत एलएल.एम. पोर्टल"],
  ["Official how-to-apply page", "आवेदन कैसे करें: आधिकारिक पृष्ठ", "अर्ज कसा करावा: अधिकृत पान"],

  // Nirnay Mitra (site search helper)
  ["Your guide to judgments, Acts, sections & careers", "निर्णयों, अधिनियमों, धाराओं और करियर के लिए आपका मार्गदर्शक", "निकाल, अधिनियम, कलमे व करिअरसाठी तुमचा मार्गदर्शक"],
  ["Namaste! I'm Nirnay Mitra.", "नमस्ते! मैं निर्णय मित्र हूँ।", "नमस्कार! मी निर्णय मित्र."],
  ["I can help you find anything on Nirnay Daily: a case or judgment, a Bare Act or a specific section, today's court and tribunal updates, or jobs, exams and LLM admissions.", "मैं Nirnay Daily पर कुछ भी खोजने में आपकी मदद कर सकता हूँ: कोई मामला या निर्णय, कोई अधिनियम या उसकी कोई धारा, आज के न्यायालय और न्यायाधिकरण के अपडेट, या नौकरियाँ, परीक्षाएँ और एलएल.एम. प्रवेश। (खोज अंग्रेज़ी शब्दों में करें।)", "मी तुम्हाला Nirnay Daily वर काहीही शोधायला मदत करू शकतो: एखादे प्रकरण किंवा निकाल, एखादा अधिनियम किंवा त्यातील कलम, आजच्या न्यायालय व न्यायाधिकरणांच्या घडामोडी, किंवा नोकऱ्या, परीक्षा व एलएल.एम. प्रवेश. (शोध इंग्रजी शब्दांत करा.)"],
  ["Type your question, or try one of these:", "अपना प्रश्न लिखें, या इनमें से कोई आज़माएँ:", "तुमचा प्रश्न लिहा, किंवा यांपैकी एक वापरून पाहा:"],
  ["Ask", "पूछें", "विचारा"],
  ["Ask a question", "प्रश्न पूछें", "प्रश्न विचारा"],
  ["Searches Nirnay Daily's own pages. Not legal advice.", "केवल Nirnay Daily के पृष्ठों में खोजता है। यह कानूनी सलाह नहीं है।", "फक्त Nirnay Daily च्या पानांमध्ये शोधतो. हा कायदेशीर सल्ला नाही."],
  ["Close", "बंद करें", "बंद करा"],
  ["Nirnay Mitra: search the site", "निर्णय मित्र: साइट में खोजें", "निर्णय मित्र: साइटवर शोधा"],
  ["Latest legal news", "नवीनतम कानूनी समाचार", "नवीन कायदेविषयक बातम्या"],
  ["Latest Supreme Court judgments", "सर्वोच्च न्यायालय के नवीनतम निर्णय", "सर्वोच्च न्यायालयाचे नवीन निकाल"],
  ["Judiciary exams open now", "अभी खुली न्यायिक परीक्षाएँ", "सध्या सुरू असलेल्या न्यायिक परीक्षा"],
  ["Right to privacy", "निजता का अधिकार", "खासगीपणाचा हक्क"],
  ["Jobs closing soon", "जल्द बंद होने वाली नौकरियाँ", "लवकरच बंद होणाऱ्या नोकऱ्या"],
  ["The site is still loading its data. Please ask again in a moment.", "साइट अभी डेटा लोड कर रही है। कृपया थोड़ी देर में फिर पूछें।", "साइट अजून माहिती लोड करत आहे. कृपया थोड्या वेळाने पुन्हा विचारा."],
  ["Today's Supreme Court judgments and orders:", "आज के सर्वोच्च न्यायालय के निर्णय और आदेश:", "आजचे सर्वोच्च न्यायालयाचे निकाल व आदेश:"],
  ["No Supreme Court entries in today's edition.", "आज के संस्करण में सर्वोच्च न्यायालय की कोई प्रविष्टि नहीं है।", "आजच्या आवृत्तीत सर्वोच्च न्यायालयाची एकही नोंद नाही."],
  ["Open the Supreme Court page", "सर्वोच्च न्यायालय पृष्ठ खोलें", "सर्वोच्च न्यायालयाचे पान उघडा"],
  ["Latest High Court decisions:", "उच्च न्यायालयों के नवीनतम निर्णय:", "उच्च न्यायालयांचे नवीन निकाल:"],
  ["Open the High Courts page", "उच्च न्यायालय पृष्ठ खोलें", "उच्च न्यायालयांचे पान उघडा"],
  ["Latest tribunal orders:", "न्यायाधिकरणों के नवीनतम आदेश:", "न्यायाधिकरणांचे नवीन आदेश:"],
  ["Open the Tribunals page", "न्यायाधिकरण पृष्ठ खोलें", "न्यायाधिकरणांचे पान उघडा"],
  ["Latest legal news:", "नवीनतम कानूनी समाचार:", "नवीन कायदेविषयक बातम्या:"],
  ["No news matches that yet. The Legal News section is updated at 10 AM and 6 PM.", "इससे मेल खाता कोई समाचार अभी नहीं है। कानूनी समाचार सुबह 10 और शाम 6 बजे अपडेट होते हैं।", "याच्याशी जुळणारी बातमी अद्याप नाही. कायदेविषयक बातम्या सकाळी 10 व संध्याकाळी 6 वाजता अद्ययावत होतात."],
  ["Open Legal News", "कानूनी समाचार खोलें", "कायदेविषयक बातम्या उघडा"],
  ["Open and upcoming opportunities that match:", "मेल खाते खुले और आने वाले अवसर:", "जुळणाऱ्या सुरू व येणाऱ्या संधी:"],
  ["Nothing open right now matches that. The Careers Portal lists everything currently open.", "अभी कोई खुला अवसर इससे मेल नहीं खाता। करियर पोर्टल में अभी खुले सभी अवसर हैं।", "सध्या सुरू असलेली एकही संधी याच्याशी जुळत नाही. करिअर पोर्टलवर सध्या सुरू असलेल्या सर्व संधी आहेत."],
  ["Open the Careers Portal", "करियर पोर्टल खोलें", "करिअर पोर्टल उघडा"],
  ["More results in Landmark Judgments", "ऐतिहासिक निर्णयों में और परिणाम", "ऐतिहासिक निकालांमध्ये आणखी परिणाम"],
  ["Sorry, something went wrong with that search. Please try different words.", "क्षमा करें, उस खोज में कुछ गड़बड़ हुई। कृपया दूसरे शब्द आज़माएँ।", "क्षमस्व, त्या शोधात काहीतरी चूक झाली. कृपया वेगळे शब्द वापरून पाहा."],
  ["Full judgment · Supreme Court", "संपूर्ण निर्णय · सर्वोच्च न्यायालय", "संपूर्ण निकालपत्र · सर्वोच्च न्यायालय"],
  ["District court", "ज़िला न्यायालय", "जिल्हा न्यायालय"],

  // frequent subject tags on rulings
  ["Criminal law", "आपराधिक कानून", "फौजदारी कायदा"],
  ["Criminal", "आपराधिक", "फौजदारी"],
  ["Criminal procedure", "आपराधिक प्रक्रिया", "फौजदारी प्रक्रिया"],
  ["Civil procedure", "सिविल प्रक्रिया", "दिवाणी प्रक्रिया"],
  ["Election law", "चुनाव कानून", "निवडणूक कायदा"],
  ["Bail", "ज़मानत", "जामीन"],
  ["Service law", "सेवा कानून", "सेवा कायदा"],
  ["Family law", "पारिवारिक कानून", "कौटुंबिक कायदा"],
  ["Family", "पारिवारिक", "कौटुंबिक"],
  ["Anti-corruption", "भ्रष्टाचार-निरोध", "भ्रष्टाचारविरोधी"],
  ["Personal liberty", "व्यक्तिगत स्वतंत्रता", "वैयक्तिक स्वातंत्र्य"],
  ["Insolvency", "दिवाला", "दिवाळखोरी"],
  ["Evidence", "साक्ष्य", "पुरावा"],
  ["Preventive detention", "निवारक निरोध", "प्रतिबंधात्मक स्थानबद्धता"],
  ["Defamation", "मानहानि", "बदनामी"],
  ["Public health", "जन स्वास्थ्य", "सार्वजनिक आरोग्य"],
  ["Constitutional law", "संवैधानिक कानून", "संवैधानिक कायदा"],
  ["Contempt", "अवमानना", "अवमान"],
  ["Personality rights", "व्यक्तित्व अधिकार", "व्यक्तिमत्त्व हक्क"],
  ["Matrimonial", "वैवाहिक", "वैवाहिक"],
  ["Maintenance", "भरण-पोषण", "पोटगी"],
  ["Sentencing", "दंड निर्धारण", "शिक्षा निश्चिती"],
  ["Cheque bounce", "चेक बाउंस", "चेक बाउन्स"],
  ["Motor accidents", "मोटर दुर्घटना", "मोटार अपघात"],
  ["Child custody", "बच्चे की कस्टडी", "मुलाचा ताबा"],
  ["Legal education", "कानूनी शिक्षा", "कायदेविषयक शिक्षण"],
  ["Legal profession", "वकालत का पेशा", "वकिली व्यवसाय"],
  ["Reservation", "आरक्षण", "आरक्षण"],
  ["Trafficking", "मानव तस्करी", "मानवी तस्करी"],
  ["Road safety", "सड़क सुरक्षा", "रस्ते सुरक्षा"],
  ["Women's safety", "महिला सुरक्षा", "महिला सुरक्षा"],
  ["Arbitration", "मध्यस्थता", "लवाद"],
  ["Taxation", "कराधान", "कर आकारणी"],
  ["Tax", "कर", "कर"],
  ["Property", "संपत्ति", "मालमत्ता"],
  ["Land acquisition", "भूमि अधिग्रहण", "भूसंपादन"],
  ["Labour law", "श्रम कानून", "कामगार कायदा"],
  ["Company law", "कंपनी कानून", "कंपनी कायदा"],

  // Bare Act subject groups
  ["Agriculture, Forest & Environment", "कृषि, वन एवं पर्यावरण", "कृषी, वन व पर्यावरण"],
  ["Appropriation (Budget) Acts", "विनियोग (बजट) अधिनियम", "विनियोजन (अर्थसंकल्प) अधिनियम"],
  ["Business & Commercial", "व्यापार एवं वाणिज्य", "व्यापार व वाणिज्य"],
  ["Business, Industry & Energy", "व्यापार, उद्योग एवं ऊर्जा", "व्यापार, उद्योग व ऊर्जा"],
  ["Civil Law & Procedure", "सिविल कानून एवं प्रक्रिया", "दिवाणी कायदा व प्रक्रिया"],
  ["Co-operatives & Trusts", "सहकारिता एवं न्यास", "सहकार व विश्वस्त संस्था"],
  ["Co-operatives, Societies & Trusts", "सहकारिता, सोसाइटी एवं न्यास", "सहकार, संस्था व विश्वस्त संस्था"],
  ["Constitution", "संविधान", "संविधान"],
  ["Courts & Civil Law", "न्यायालय एवं सिविल कानून", "न्यायालये व दिवाणी कायदा"],
  ["Criminal Law", "आपराधिक कानून", "फौजदारी कायदा"],
  ["Finance, Tax & Stamp", "वित्त, कर एवं स्टाम्प", "वित्त, कर व मुद्रांक"],
  ["Health & Welfare", "स्वास्थ्य एवं कल्याण", "आरोग्य व कल्याण"],
  ["Labour", "श्रम", "कामगार"],
  ["Labour & Employment", "श्रम एवं रोज़गार", "कामगार व रोजगार"],
  ["Labour Codes", "श्रम संहिताएँ", "कामगार संहिता"],
  ["Land & Revenue", "भूमि एवं राजस्व", "जमीन व महसूल"],
  ["Legislature & Administration", "विधानमंडल एवं प्रशासन", "विधिमंडळ व प्रशासन"],
  ["Local Government", "स्थानीय शासन", "स्थानिक स्वराज्य संस्था"],
  ["Other Central Acts", "अन्य केंद्रीय अधिनियम", "इतर केंद्रीय अधिनियम"],
  ["Other Maharashtra Acts", "महाराष्ट्र के अन्य अधिनियम", "महाराष्ट्राचे इतर अधिनियम"],
  ["Other State Acts", "अन्य राज्य अधिनियम", "इतर राज्य अधिनियम"],
  ["Police & Criminal", "पुलिस एवं आपराधिक", "पोलीस व फौजदारी"],
  ["Property & Land", "संपत्ति एवं भूमि", "मालमत्ता व जमीन"],
  ["Rights & Welfare", "अधिकार एवं कल्याण", "हक्क व कल्याण"],
  ["Tax, Stamp & Court Fees", "कर, स्टाम्प एवं न्यायालय शुल्क", "कर, मुद्रांक व न्यायालय शुल्क"],
  ["Technology & IP", "प्रौद्योगिकी एवं बौद्धिक संपदा", "तंत्रज्ञान व बौद्धिक संपदा"],
  ["Universities & Education", "विश्वविद्यालय एवं शिक्षा", "विद्यापीठे व शिक्षण"],
  ["Urban Planning & Housing", "नगर नियोजन एवं आवास", "नगररचना व गृहनिर्माण"]
  ];

  /* High Courts and States / UTs */
  var PLACES = {
    "Allahabad": ["इलाहाबाद", "अलाहाबाद"], "Andhra Pradesh": ["आंध्र प्रदेश", "आंध्र प्रदेश"], "Bombay": ["बॉम्बे", "मुंबई"],
    "Calcutta": ["कलकत्ता", "कलकत्ता"], "Chhattisgarh": ["छत्तीसगढ़", "छत्तीसगड"], "Delhi": ["दिल्ली", "दिल्ली"],
    "Gauhati": ["गौहाटी", "गुवाहाटी"], "Gujarat": ["गुजरात", "गुजरात"], "Himachal Pradesh": ["हिमाचल प्रदेश", "हिमाचल प्रदेश"],
    "Jammu & Kashmir and Ladakh": ["जम्मू-कश्मीर और लद्दाख", "जम्मू-काश्मीर आणि लडाख"], "Jammu and Kashmir": ["जम्मू-कश्मीर", "जम्मू-काश्मीर"],
    "Jammu & Kashmir": ["जम्मू-कश्मीर", "जम्मू-काश्मीर"], "Jharkhand": ["झारखंड", "झारखंड"], "Karnataka": ["कर्नाटक", "कर्नाटक"],
    "Kerala": ["केरल", "केरळ"], "Madhya Pradesh": ["मध्य प्रदेश", "मध्य प्रदेश"], "Madras": ["मद्रास", "मद्रास"],
    "Manipur": ["मणिपुर", "मणिपूर"], "Meghalaya": ["मेघालय", "मेघालय"], "Orissa": ["उड़ीसा", "ओरिसा"], "Patna": ["पटना", "पाटणा"],
    "Punjab & Haryana": ["पंजाब एवं हरियाणा", "पंजाब व हरियाणा"], "Rajasthan": ["राजस्थान", "राजस्थान"], "Sikkim": ["सिक्किम", "सिक्कीम"],
    "Telangana": ["तेलंगाना", "तेलंगणा"], "Tripura": ["त्रिपुरा", "त्रिपुरा"], "Uttarakhand": ["उत्तराखंड", "उत्तराखंड"],
    "Prayagraj": ["प्रयागराज", "प्रयागराज"], "Amaravati": ["अमरावती", "अमरावती"], "Mumbai": ["मुंबई", "मुंबई"], "New Delhi": ["नई दिल्ली", "नवी दिल्ली"],
    "Guwahati": ["गुवाहाटी", "गुवाहाटी"], "Bengaluru": ["बेंगलुरु", "बंगळुरू"], "Kochi": ["कोच्चि", "कोची"], "Chennai": ["चेन्नई", "चेन्नई"],
    "Kolkata": ["कोलकाता", "कोलकाता"], "Nainital": ["नैनीताल", "नैनिताल"], "Jabalpur": ["जबलपुर", "जबलपूर"], "Shimla": ["शिमला", "शिमला"],
    "Ranchi": ["रांची", "रांची"], "Bilaspur": ["बिलासपुर", "बिलासपूर"], "Jodhpur": ["जोधपुर", "जोधपूर"], "Hyderabad": ["हैदराबाद", "हैदराबाद"],
    "Ahmedabad": ["अहमदाबाद", "अहमदाबाद"], "Cuttack": ["कटक", "कटक"], "Gangtok": ["गंगटोक", "गंगटोक"], "Agartala": ["अगरतला", "आगरतळा"],
    "Shillong": ["शिलांग", "शिलाँग"], "Imphal": ["इम्फाल", "इंफाळ"], "Srinagar & Jammu": ["श्रीनगर एवं जम्मू", "श्रीनगर व जम्मू"],
    "Srinagar": ["श्रीनगर", "श्रीनगर"], "Jammu": ["जम्मू", "जम्मू"], "Nagpur": ["नागपुर", "नागपूर"], "Panaji": ["पणजी", "पणजी"],
    "Assam": ["असम", "आसाम"], "Bihar": ["बिहार", "बिहार"], "Odisha": ["ओडिशा", "ओडिशा"], "Tamil Nadu": ["तमिलनाडु", "तामिळनाडू"],
    "Uttar Pradesh": ["उत्तर प्रदेश", "उत्तर प्रदेश"], "West Bengal": ["पश्चिम बंगाल", "पश्चिम बंगाल"], "Maharashtra": ["महाराष्ट्र", "महाराष्ट्र"],
    "Goa": ["गोवा", "गोवा"], "Haryana": ["हरियाणा", "हरियाणा"], "Punjab": ["पंजाब", "पंजाब"], "Ladakh": ["लद्दाख", "लडाख"],
    "Chandigarh": ["चंडीगढ़", "चंदीगड"], "Puducherry": ["पुदुचेरी", "पुदुच्चेरी"], "Arunachal Pradesh": ["अरुणाचल प्रदेश", "अरुणाचल प्रदेश"],
    "Mizoram": ["मिज़ोरम", "मिझोराम"], "Nagaland": ["नागालैंड", "नागालँड"], "Lakshadweep": ["लक्षद्वीप", "लक्षद्वीप"],
    "Andaman and Nicobar Islands": ["अंडमान और निकोबार द्वीपसमूह", "अंदमान आणि निकोबार बेटे"],
    "Dadra and Nagar Haveli and Daman and Diu": ["दादरा और नगर हवेली और दमन और दीव", "दादरा व नगर हवेली आणि दमण व दीव"]
  };
  var D = new Map();
  T.forEach(function (r) { D.set(norm(r[0]), [r[1], r[2]]); });
  Object.keys(PLACES).forEach(function (k) { if (!D.has(k)) D.set(k, PLACES[k]); });
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function pick(a) { return a[I]; }
  function place(s) { var p = PLACES[s]; return p ? p[I] : s; }

  /* ---------- dates ---------- */
  var MON = { January: ["जनवरी", "जानेवारी"], February: ["फ़रवरी", "फेब्रुवारी"], March: ["मार्च", "मार्च"], April: ["अप्रैल", "एप्रिल"],
    May: ["मई", "मे"], June: ["जून", "जून"], July: ["जुलाई", "जुलै"], August: ["अगस्त", "ऑगस्ट"], September: ["सितंबर", "सप्टेंबर"],
    October: ["अक्टूबर", "ऑक्टोबर"], November: ["नवंबर", "नोव्हेंबर"], December: ["दिसंबर", "डिसेंबर"] };
  var SHORT = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", Jun: "June", Jul: "July", Aug: "August",
    Sep: "September", Sept: "September", Oct: "October", Nov: "November", Dec: "December" };
  var DAY = { Monday: ["सोमवार", "सोमवार"], Tuesday: ["मंगलवार", "मंगळवार"], Wednesday: ["बुधवार", "बुधवार"], Thursday: ["गुरुवार", "गुरुवार"],
    Friday: ["शुक्रवार", "शुक्रवार"], Saturday: ["शनिवार", "शनिवार"], Sunday: ["रविवार", "रविवार"] };
  var MON_RE = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\b\.?/g;
  var DAY_RE = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g;
  function tDate(s) {
    return s.replace(/\b(\d{1,2})(st|nd|rd|th)\b/g, "$1")
      .replace(DAY_RE, function (m) { return DAY[m][I]; })
      .replace(MON_RE, function (m, w) { return MON[SHORT[w] || w][I]; })
      .replace(/(^|\D)(\d{1,2} \S+),( \d{4})/g, "$1$2$3")
      .replace(/^([^\s,]+),? (\d{1,2} \S+ \d{4})$/, "$1, $2");
  }
  function isDateish(s) { return /\d/.test(s) && (MON_RE.test(s) || DAY_RE.test(s)) && !(MON_RE.lastIndex = DAY_RE.lastIndex = 0); }
  function onlyDate(s) {   /* translate when the text is nothing but a date */
    MON_RE.lastIndex = DAY_RE.lastIndex = 0;
    if (!isDateish(s)) return null;
    var r = tDate(s);
    return /[A-Za-z]/.test(r) ? null : r;
  }
  function loose(s) {   /* dates inside a longer phrase; times like "10:00 AM IST" stay as they are */
    return tDate(s.replace(/(\d{1,2}(?::\d{2})? ?(?:AM|PM)(?: IST)?),? on (\d{1,2}(?:st|nd|rd|th)? [A-Z][a-z]+,? \d{4})/g, "$2, $1")
                  .replace(/(\d{1,2}(?::\d{2})? ?(?:AM|PM)(?: IST)?), (\d{1,2} [A-Z][a-z]+(?:,? \d{4})?)/g, "$2, $1"));
  }

  /* ---------- patterns for wording that carries a number, date or name ---------- */
  var R = [
    [/^Decided ([^·]+)$/, function (m) { return [ "निर्णय: " + loose(m[1]), "निकाल: " + loose(m[1]) ]; }],
    [/^Reported ([^·]+)$/, function (m) { return [ "रिपोर्ट: " + loose(m[1]), "वृत्त: " + loose(m[1]) ]; }],
    [/^Coram:\s*(.+)$/, function (m) { return [ "पीठ: " + m[1], "खंडपीठ: " + m[1] ]; }],
    [/^Report · (.+) ↗$/, function (m) { return [ "रिपोर्ट · " + m[1] + " ↗", "वृत्त · " + m[1] + " ↗" ]; }],
    [/^Read report · (.+) ↗$/, function (m) { return [ "रिपोर्ट पढ़ें · " + m[1] + " ↗", "वृत्त वाचा · " + m[1] + " ↗" ]; }],
    [/^High Court of (.+)$/, function (m) { return PLACES[m[1]] ? [ place(m[1]) + " उच्च न्यायालय", place(m[1]) + " उच्च न्यायालय" ] : null; }],
    [/^(.+) High Court$/, function (m) { return PLACES[m[1]] ? [ place(m[1]) + " उच्च न्यायालय", place(m[1]) + " उच्च न्यायालय" ] : null; }],
    [/^From the Landmark Library · (.+)$/, function (m) { var t = tr(m[1]) || m[1]; return [ "ऐतिहासिक निर्णय संग्रह से · " + t, "ऐतिहासिक निकाल संग्रहातून · " + t ]; }],
    [/^(\d+)-(?:member|judge) bench$/, function (m) { return [ m[1] + " न्यायाधीशों की पीठ", m[1] + " न्यायमूर्तींचे खंडपीठ" ]; }],
    [/^THE (\d{4})s$/, function (m) { return [ m[1] + " का दशक", m[1] + " चे दशक" ]; }],
    [/^([\d,]+) pages$/, function (m) { return [ m[1] + " पृष्ठ", m[1] + " पाने" ]; }],
    [/^Page (\d+)$/, function (m) { return [ "पृष्ठ " + m[1], "पान " + m[1] ]; }],
    [/^Page (\d+) of (\d+)$/, function (m) { return [ "पृष्ठ " + m[1] + " / " + m[2], "पान " + m[1] + " / " + m[2] ]; }],
    [/^(\d+) matches$/, function (m) { return [ m[1] + " परिणाम", m[1] + " परिणाम" ]; }],
    [/^(\d+) of (\d+)$/, function (m) { return [ m[1] + " / " + m[2], m[1] + " / " + m[2] ]; }],
    [/^Act No\. (\S+) of (\d{4})$/, function (m) { return [ m[2] + " का अधिनियम संख्यांक " + m[1], "सन " + m[2] + " चा अधिनियम क्रमांक " + m[1] ]; }],
    [/^as on (.+)$/, function (m) { return [ loose(m[1]) + " तक अद्यतन", loose(m[1]) + " पर्यंत अद्ययावत" ]; }],
    [/^(\d+) Acts$/, function (m) { return [ m[1] + " अधिनियम", m[1] + " अधिनियम" ]; }],
    [/^(\d+) stories$/, function (m) { return [ m[1] + " समाचार", m[1] + " बातम्या" ]; }],
    [/^(\d+) days? left$/, function (m) { return [ m[1] + " दिन शेष", m[1] + " दिवस बाकी" ]; }],
    [/^(\d+) openings?$/, function (m) { return [ m[1] + " अवसर", m[1] + " संधी" ]; }],
    [/^(\d+) awaited$/, function (m) { return [ m[1] + " प्रतीक्षित", m[1] + " प्रतीक्षेत" ]; }],
    [/^Show older editions \((\d+) more\)$/, function (m) { return [ "पुराने संस्करण दिखाएँ (" + m[1] + " और)", "जुन्या आवृत्त्या दाखवा (आणखी " + m[1] + ")" ]; }],
    [/^Show older months \((\d+) more\)$/, function (m) { return [ "पुराने महीने दिखाएँ (" + m[1] + " और)", "जुने महिने दाखवा (आणखी " + m[1] + ")" ]; }],
    [/^Vol\. (\S+) · No\. (\d+)$/, function (m) { return [ "खंड " + m[1] + " · अंक " + m[2], "खंड " + m[1] + " · अंक " + m[2] ]; }],
    [/^Judgments and orders passed between (.+) and (.+)$/, function (m) { return [ loose(m[1]) + " से " + loose(m[2]) + " के बीच पारित निर्णय और आदेश", loose(m[1]) + " ते " + loose(m[2]) + " दरम्यान दिलेले निकाल व आदेश" ]; }],
    [/^Orders and decisions (?:passed or reported|reported|passed) between (.+) and (.+)$/, function (m) { return [ loose(m[1]) + " से " + loose(m[2]) + " के बीच पारित या प्रकाशित आदेश और निर्णय", loose(m[1]) + " ते " + loose(m[2]) + " दरम्यान दिलेले किंवा प्रसिद्ध झालेले आदेश व निर्णय" ]; }],
    [/^News from (.+) to (.+)$/, function (m) { return [ loose(m[1]) + " से " + loose(m[2]) + " तक के समाचार", loose(m[1]) + " ते " + loose(m[2]) + " पर्यंतच्या बातम्या" ]; }],
    [/^Every (.+) State Act published by the Government of India on India Code, the official repository of Central and State Acts, with its official PDF\. Central Acts that India Code also files under (.+) are left out here; you will find them under Central Acts\. Some official copies are in Hindi, and some are scanned page images, which can be downloaded but not searched word by word\.$/,
      function (m) { var s = place(m[1]); return [ s + " का हर राज्य अधिनियम, जैसा भारत सरकार ने केंद्रीय और राज्य अधिनियमों के आधिकारिक भंडार India Code पर प्रकाशित किया है, अपने आधिकारिक PDF के साथ। जिन केंद्रीय अधिनियमों को India Code " + s + " के अंतर्गत भी रखता है, वे यहाँ नहीं हैं; वे केंद्रीय अधिनियमों में मिलेंगे। कुछ आधिकारिक प्रतियाँ हिन्दी में हैं, और कुछ स्कैन किए गए पृष्ठ हैं, जिन्हें डाउनलोड किया जा सकता है पर शब्दशः खोजा नहीं जा सकता।",
        s + " चा प्रत्येक राज्य अधिनियम, भारत सरकारने केंद्रीय व राज्य अधिनियमांच्या अधिकृत भांडार India Code वर प्रसिद्ध केल्याप्रमाणे, त्याच्या अधिकृत PDF सह. India Code ज्या केंद्रीय अधिनियमांना " + s + " अंतर्गतही ठेवते, ते येथे नाहीत; ते केंद्रीय अधिनियमांत मिळतील. काही अधिकृत प्रती हिंदीत आहेत, आणि काही स्कॅन केलेली पाने आहेत, जी डाउनलोड करता येतात पण शब्दशः शोधता येत नाहीत." ]; }],
    [/^Every Act is the official text published by the Government of India on India Code \(indiacode\.gov\.in\), which holds both Central Acts and State Acts, in the latest updated version available there\.( State Act PDFs are stored unchanged, byte for byte, as India Code publishes them, and each Act links to its India Code page\.)? "As on" gives the date up to which the official text includes amendments\. Check the official Gazette for any amendment made after that date before relying on a provision\.(?: Collection last checked (.+)\.)?$/,
      function (m) { var st = !!m[1], d = m[2] ? loose(m[2]) : "";
        return [ "हर अधिनियम भारत सरकार द्वारा India Code (indiacode.gov.in) पर प्रकाशित आधिकारिक पाठ है, जिसमें केंद्रीय और राज्य दोनों अधिनियम हैं, वहाँ उपलब्ध नवीनतम संस्करण में।" + (st ? " राज्य अधिनियमों के PDF बिना किसी बदलाव के, ठीक वैसे ही रखे गए हैं जैसे India Code उन्हें प्रकाशित करता है, और हर अधिनियम उसके India Code पृष्ठ से जुड़ा है।" : "") + " \"तक अद्यतन\" वह तिथि बताता है जहाँ तक के संशोधन आधिकारिक पाठ में शामिल हैं। किसी प्रावधान पर भरोसा करने से पहले उस तिथि के बाद हुए संशोधनों के लिए आधिकारिक राजपत्र देखें।" + (d ? " संग्रह की अंतिम जाँच " + d + " को हुई।" : ""),
          "प्रत्येक अधिनियम हा भारत सरकारने India Code (indiacode.gov.in) वर प्रसिद्ध केलेला अधिकृत मजकूर आहे, ज्यात केंद्रीय व राज्य दोन्ही अधिनियम आहेत, तेथे उपलब्ध नवीन आवृत्तीत." + (st ? " राज्य अधिनियमांचे PDF कोणताही बदल न करता, India Code प्रसिद्ध करते तसेच ठेवले आहेत, आणि प्रत्येक अधिनियम त्याच्या India Code पानाशी जोडलेला आहे." : "") + " \"पर्यंत अद्ययावत\" ही तारीख सांगते की अधिकृत मजकुरात कोणत्या तारखेपर्यंतच्या दुरुस्त्या आहेत. एखाद्या तरतुदीवर विसंबण्यापूर्वी त्या तारखेनंतरच्या दुरुस्त्यांसाठी अधिकृत राजपत्र पाहा." + (d ? " संग्रहाची शेवटची पडताळणी " + d + " रोजी झाली." : "") ]; }],
    [/^Here's what I found on Nirnay Daily for “(.+)”:$/, function (m) { return [ "“" + m[1] + "” के लिए Nirnay Daily पर यह मिला:", "“" + m[1] + "” साठी Nirnay Daily वर हे सापडले:" ]; }],
    [/^I couldn't find “(.+)” on Nirnay Daily\. Try a case name, an Act, a section \(like “section 103 BNS”\), a court, or a job\/exam\.$/, function (m) { return [ "Nirnay Daily पर “" + m[1] + "” नहीं मिला। किसी मामले का नाम, अधिनियम, धारा (जैसे “section 103 BNS”), न्यायालय, या नौकरी/परीक्षा आज़माएँ।", "Nirnay Daily वर “" + m[1] + "” सापडले नाही. प्रकरणाचे नाव, अधिनियम, कलम (उदा. “section 103 BNS”), न्यायालय, किंवा नोकरी/परीक्षा वापरून पाहा." ]; }]
  ];

  var cache = new Map();
  function tr(s) {
    s = norm(s);
    if (!s || !/[A-Za-z]/.test(s)) return null;
    if (cache.has(s)) return cache.get(s);
    var out = null, hit = D.get(s);
    if (hit) out = pick(hit);
    if (out == null) for (var i = 0; i < R.length; i++) { var m = s.match(R[i][0]); if (m) { var v = R[i][1](m); if (v) { out = pick(v); break; } } }
    if (out == null && / ↗$/.test(s)) { var st = tr(s.slice(0, -2)); if (st) out = st + " ↗"; }
    if (out == null && s.indexOf(" · ") > 0) {
      var parts = s.split(" · "), ch = false;
      parts = parts.map(function (p) { var t = tr(p); if (t) { ch = true; return t; } return p; });
      if (ch) out = parts.join(" · ");
    }
    if (out == null) out = onlyDate(s);
    cache.set(s, out);
    return out;
  }
  window.ndT = function (s) { return tr(s) || s; };

  /* ---------- apply to the page ---------- */
  var SKIP = "script,style,textarea,#rdbody p,#rdbody pre,.cname,.lm h3,.libcard .ln,.rd-head h2,.job .org,.ref,.act h3,.act-rep,.dv,[data-noi18n],select#nd-lang";
  function skip(el) { return !el || (el.closest && el.closest(SKIP)); }
  var KIND = { "Held": ["निर्णय दिया", "निकाल दिला"], "Notice": ["नोटिस जारी", "नोटीस जारी"], "Reserved": ["निर्णय सुरक्षित", "निकाल राखून ठेवला"],
    "Pending": ["लंबित", "प्रलंबित"], "Split": ["विभाजित निर्णय", "विभाजित निकाल"], "Referred": ["बड़ी पीठ को भेजा", "मोठ्या खंडपीठाकडे पाठवले"] };
  function doText(n) {
    var v = n.nodeValue; if (!v || !/[A-Za-z]/.test(v)) return;
    var pe = n.parentElement;
    if (skip(pe)) return;
    var t = norm(v); var r = (pe.classList.contains("kind") && KIND[t]) ? KIND[t][I] : tr(t);
    if (r && r !== t) {
      var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
      n.nodeValue = lead + r + trail;
    }
  }
  var ATTRS = ["placeholder", "title", "aria-label"];
  function doEl(el) {
    if (skip(el)) return;
    for (var i = 0; i < ATTRS.length; i++) { var a = el.getAttribute(ATTRS[i]); if (a) { var r = tr(a); if (r && r !== a) el.setAttribute(ATTRS[i], r); } }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches("script,style")) return;
    doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  function start() {
    walk(document.body);
    var t = tr(document.title); if (t) document.title = t;
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") doEl(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
