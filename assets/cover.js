/* Nirnay Daily — entrance cover page.
   Appears when someone opens the home page. Any click (left or right), tap, or Enter / Space / Esc opens the site.
   Skipped for links straight to a section (e.g. nirnaydaily.in/#bare-acts) and with ?nocover. Force it with ?cover. */
(function () {
  var q = location.search, h = location.hash;
  var force = /[?&]cover\b/.test(q);
  if (!force && (/[?&]nocover\b/.test(q) || (h && h !== "#" && h !== "#home"))) return;

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia && matchMedia("(hover: none)").matches;
  var word = "NIRNAY DAILY".split("").map(function (c, i) {
    return c === " " ? '<span class="sp"> </span>' : '<span style="animation-delay:' + (0.55 + i * 0.07).toFixed(2) + 's,' + (2.6 + i * 0.05).toFixed(2) + 's">' + c + "</span>";
  }).join("");
  var date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  var gavel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l6 6M10 7l6 6M11.5 5.5l6 6M13.5 9.5L4 19M3 21h9"/></svg>';

  var html =
    '<div id="nd-cover" role="dialog" aria-modal="true" aria-label="Welcome to Nirnay Daily">' +
      '<div class="ndc-door l"></div><div class="ndc-door r"></div>' +
      '<div class="ndc-light"></div><canvas aria-hidden="true"></canvas>' +
      '<span class="ndc-corner tl"></span><span class="ndc-corner tr"></span><span class="ndc-corner bl"></span><span class="ndc-corner br"></span>' +
      '<div class="ndc-stage">' +
        '<div class="ndc-kicker">India’s Courts · Decoded Daily</div>' +
        '<svg class="ndc-seal" viewBox="0 0 400 400" aria-hidden="true">' +
          '<defs><path id="ndc-ring" d="M200,200 m-148,0 a148,148 0 1,1 296,0 a148,148 0 1,1 -296,0"/></defs>' +
          '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle class="draw" cx="200" cy="200" r="192" stroke-width="6"/>' +
            '<circle class="draw" cx="200" cy="200" r="178" stroke-width="1.5" style="animation-delay:.45s"/>' +
            '<circle class="draw" cx="200" cy="200" r="118" stroke-width="1.5" style="animation-delay:.65s"/>' +
            '<path class="draw" d="M200 118v162M160 290h80" stroke-width="7" style="animation-delay:.8s"/>' +
            '<circle class="pan" cx="200" cy="118" r="8" stroke-width="7"/>' +
            '<g class="beam" stroke-width="7"><path d="M130 150h140"/>' +
              '<g class="pan"><path d="M130 150l-28 60a28 28 0 0 0 56 0L130 150zM270 150l-28 60a28 28 0 0 0 56 0L270 150z"/></g></g>' +
          '</g>' +
          '<g class="ring"><text font-family="Cinzel, Georgia, serif" font-size="21" font-weight="700" fill="currentColor" letter-spacing="3">' +
            '<textPath href="#ndc-ring" textLength="915" lengthAdjust="spacing">· SATYAMEVA JAYATE · NIRNAY DAILY · JUDGMENTS · ORDERS · EST. 2026 </textPath></text></g>' +
        '</svg>' +
        '<h1 class="ndc-word" aria-label="Nirnay Daily">' + word + '</h1>' +
        '<div class="ndc-deva" lang="hi">निर्णय</div>' +
        '<div class="ndc-tag">Judgments · Orders · Landmark Cases · Bare Acts · Careers in Law</div>' +
        '<div class="ndc-date">' + date + '</div>' +
        '<div class="ndc-stats" aria-live="polite"></div>' +
        '<div class="ndc-maxim"><p><span class="la"></span><span class="en" style="display:block"></span></p></div>' +
      '</div>' +
      '<div class="ndc-cta"><button class="ndc-btn" type="button">' + gavel + 'Enter the court</button>' +
        '<span class="ndc-hint">' + (touch ? "or tap anywhere" : "or click anywhere") + '</span></div>' +
    '</div>';

  document.body.insertAdjacentHTML("afterbegin", html);
  var el = document.getElementById("nd-cover");
  var root = document.documentElement;
  root.classList.add("nd-cover-lock");

  /* rotating legal maxims */
  var maxims = [
    ["Satyameva Jayate", "Truth alone triumphs"],
    ["Audi alteram partem", "Let the other side be heard"],
    ["Fiat justitia ruat caelum", "Let justice be done though the heavens fall"],
    ["Nemo judex in causa sua", "No one should be a judge in their own cause"],
    ["Ubi jus ibi remedium", "Where there is a right, there is a remedy"],
    ["Actus non facit reum nisi mens sit rea", "The act is not guilty unless the mind is guilty"],
    ["Salus populi suprema lex esto", "The welfare of the people shall be the supreme law"]
  ];
  var mx = el.querySelector(".ndc-maxim p"), mi = 0, mTimer;
  function showMaxim() {
    mx.querySelector(".la").textContent = "“" + maxims[mi][0] + "”";
    mx.querySelector(".en").textContent = maxims[mi][1];
  }
  showMaxim();
  mTimer = setInterval(function () {
    mx.classList.add("out");
    setTimeout(function () { mi = (mi + 1) % maxims.length; showMaxim(); mx.classList.remove("out"); }, 600);
  }, 4200);

  /* live numbers from the site's own data (hidden if they cannot be read) */
  var stats = el.querySelector(".ndc-stats");
  function count(node, n) {
    if (reduce) { node.textContent = n.toLocaleString("en-IN"); return; }
    var t0 = performance.now(), d = 1600;
    (function step(t) {
      var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(n * e).toLocaleString("en-IN");
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  Promise.all([
    fetch("data/sc-library.json").then(function (r) { return r.json(); }).then(function (j) { return (j.items || []).length; }).catch(function () { return 0; }),
    fetch("data/bare-acts.json").then(function (r) { return r.json(); }).then(function (j) {
      var n = 0, s = 0; for (var k in j) if (Array.isArray(j[k])) { n += j[k].length; s++; } return [n, s];
    }).catch(function () { return [0, 0]; })
  ]).then(function (v) {
    var parts = [];
    if (v[0] > 0) parts.push([v[0], "Supreme Court<br>judgments in full"]);
    if (v[1][0] > 0) parts.push([v[1][0], "Bare Acts · " + v[1][1] + "<br>jurisdictions"]);
    if (!parts.length || !document.body.contains(el)) return;
    parts.push([365, "days a year<br>of court updates"]);
    stats.innerHTML = parts.map(function (p) { return '<div class="ndc-stat"><b data-n="' + p[0] + '">0</b><small>' + p[1] + "</small></div>"; }).join("");
    setTimeout(function () {
      stats.classList.add("on");
      stats.querySelectorAll("b").forEach(function (b) { count(b, +b.getAttribute("data-n")); });
    }, reduce ? 0 : 2300);
  });

  /* cursor spotlight */
  function move(e) {
    var p = e.touches ? e.touches[0] : e;
    el.style.setProperty("--mx", p.clientX + "px");
    el.style.setProperty("--my", p.clientY + "px");
  }
  el.addEventListener("pointermove", move);

  /* floating gold dust */
  var cv = el.querySelector("canvas"), cx = cv.getContext("2d"), dots = [], raf, W, H, dpr = Math.min(2, window.devicePixelRatio || 1);
  function size() { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; }
  if (!reduce && cx) {
    size(); addEventListener("resize", size);
    var N = Math.round(Math.min(110, innerWidth / 12));
    for (var i = 0; i < N; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + .4) * dpr, s: (Math.random() * .25 + .06) * dpr, a: Math.random() * 6.28, w: Math.random() * .02 + .005 });
    (function tick() {
      cx.clearRect(0, 0, W, H);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i]; d.y -= d.s; d.a += d.w; d.x += Math.sin(d.a) * .3 * dpr;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        var al = .25 + .55 * (0.5 + 0.5 * Math.sin(d.a * 2));
        cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.283);
        cx.fillStyle = "rgba(243,196,107," + al.toFixed(3) + ")"; cx.shadowColor = "rgba(243,196,107,.8)"; cx.shadowBlur = 6 * dpr; cx.fill();
      }
      raf = requestAnimationFrame(tick);
    })();
  }

  /* open the site: gold ripple, then the doors swing apart */
  var opened = false;
  function enter(e) {
    if (opened) return; opened = true;
    var x = innerWidth / 2, y = innerHeight / 2;
    if (e && e.clientX != null && (e.clientX || e.clientY)) { x = e.clientX; y = e.clientY; }
    var rp = document.createElement("span"); rp.className = "ndc-ripple"; rp.style.left = x + "px"; rp.style.top = y + "px"; el.appendChild(rp);
    var fl = document.createElement("span"); fl.className = "ndc-flash"; fl.style.setProperty("--cx", x + "px"); fl.style.setProperty("--cy", y + "px"); el.appendChild(fl);
    setTimeout(function () { el.classList.add("open"); }, reduce ? 0 : 160);
    setTimeout(function () {
      cancelAnimationFrame(raf); clearInterval(mTimer);
      root.classList.remove("nd-cover-lock");
      el.remove();
      document.removeEventListener("keydown", key);
      var main = document.getElementById("app"); if (main) { main.setAttribute("tabindex", "-1"); try { main.focus({ preventScroll: true }); } catch (e) {} }
      window.nirnayTrack && nirnayTrack("cover_enter", {});
    }, reduce ? 400 : 1450);
  }
  el.addEventListener("click", enter);
  el.addEventListener("contextmenu", function (e) { e.preventDefault(); enter(e); });
  function key(e) { if (e.key === "Enter" || e.key === " " || e.key === "Escape") { e.preventDefault(); enter(); } }
  document.addEventListener("keydown", key);
})();
