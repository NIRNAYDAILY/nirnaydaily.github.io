/* Nirnay Daily – free sign-in gate (Firebase Authentication).
   Visitors see a blurred page until they sign in with Google or with any email address
   (Gmail, Yahoo, Outlook, Rediffmail …) through a one-time sign-in link.
   The list of signed-in readers is kept in Firebase → Authentication → Users.
   The gate stays OFF until window.NIRNAY_FIREBASE holds the project's web config. */
const CFG = window.NIRNAY_FIREBASE || null;
const OPT = Object.assign({ google: true, microsoft: false, yahoo: false, emailLink: true }, window.NIRNAY_LOGIN || {});
const PREVIEW = !CFG && /[?&]loginpreview\b/.test(location.search);
const V = "10.12.2", CDN = `https://www.gstatic.com/firebasejs/${V}/`;
const $ = (s, r = document) => r.querySelector(s);
const track = (n, p) => { try { window.nirnayTrack && window.nirnayTrack(n, p || {}); } catch (e) {} };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const ICON = {
  google: '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-10l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>',
  microsoft: '<svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true"><path fill="#F25022" d="M0 0h10v10H0z"/><path fill="#7FBA00" d="M11 0h10v10H11z"/><path fill="#00A4EF" d="M0 11h10v10H0z"/><path fill="#FFB900" d="M11 11h10v10H11z"/></svg>',
  yahoo: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#6001D2"/><path fill="#fff" d="M5 7h3l2 4.6L12 7h3l-4.3 8.6V19H8.6v-3.4z"/></svg>'
};

let fb = null; // { auth, mod }

function gate(on) { document.documentElement.classList.toggle("gated", !!on); if (!on) { const b = $(".lg-back"); b && b.remove(); } }

function card() {
  if ($(".lg-back")) return;
  const consent = store.get("nd-consent") === "1";
  const pendingEmail = store.get("nd-email-link");
  const btn = (id, label) => OPT[id] ? `<button class="lg-btn" data-p="${id}" type="button">${ICON[id]} Continue with ${label}</button>` : "";
  const el = document.createElement("div");
  el.className = "lg-back";
  el.innerHTML = `<div class="lg-card" role="dialog" aria-modal="true" aria-labelledby="lg-t">
    <span class="lg-free">Free · no charges ever</span>
    <h2 id="lg-t">Sign in to read Nirnay Daily<span lang="hi">निर्णय</span></h2>
    <p>Daily judgments, full Supreme Court judgments, Bare Acts, Legal News and the Careers Portal are free for every reader. Please sign in once to continue.</p>
    <label class="lg-consent"><input type="checkbox" id="lg-ok" ${consent ? "checked" : ""}>
      <span>I agree that Nirnay Daily may keep my name and email address to manage my free account, as explained in the <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a>.</span></label>
    ${btn("google", "Google")}${btn("microsoft", "Microsoft (Outlook, Hotmail)")}${btn("yahoo", "Yahoo")}
    ${OPT.emailLink ? `<div class="lg-or">or use any email address</div>
      <form id="lg-f"><input type="email" id="lg-e" required placeholder="Your email (Gmail, Yahoo, Outlook …)" autocomplete="email" value="${esc(pendingEmail || "")}">
      <button class="lg-btn primary" type="submit">${pendingEmail && fb && fb.linkMode ? "Finish signing in" : "Email me a sign-in link"}</button></form>` : ""}
    <div class="lg-msg" id="lg-m" aria-live="polite"></div>
    <p class="lg-fine">No password needed. We never post anything or share your details. Questions: <a href="mailto:nirnaydaily@gmail.com">nirnaydaily@gmail.com</a></p>
  </div>`;
  document.body.appendChild(el);
  const ok = $("#lg-ok", el), msg = (t, cls) => { const m = $("#lg-m", el); m.textContent = t; m.className = "lg-msg " + (cls || ""); };
  const need = () => { if (ok.checked) { store.set("nd-consent", "1"); return true; } msg("Please tick the box to agree to the Privacy Notice first.", "err"); ok.focus(); return false; };
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    if (!need()) return;
    if (PREVIEW) return msg("Preview only – sign-in starts working once the Firebase project is connected.", "ok");
    await providerSignIn(b.dataset.p, msg);
  });
  const f = $("#lg-f", el);
  f && f.addEventListener("submit", async e => {
    e.preventDefault(); if (!need()) return;
    const email = $("#lg-e", el).value.trim(); if (!email) return;
    if (PREVIEW) return msg("Preview only – sign-in starts working once the Firebase project is connected.", "ok");
    if (fb.linkMode) return finishLink(email, msg);
    try {
      await fb.mod.sendSignInLinkToEmail(fb.auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
      store.set("nd-email-link", email);
      msg(`Sign-in link sent to ${email}. Open it on this device to continue (check Spam/Promotions if you don't see it).`, "ok");
      track("login_link_sent");
    } catch (err) { msg(explain(err), "err"); }
  });
}

function explain(err) {
  const c = (err && err.code) || "";
  if (c.includes("popup-closed")) return "The sign-in window was closed before finishing. Please try again.";
  if (c.includes("invalid-email")) return "That email address doesn't look right.";
  if (c.includes("unauthorized-domain")) return "Sign-in isn't enabled for this web address yet.";
  if (c.includes("operation-not-allowed")) return "This sign-in method isn't switched on yet.";
  if (c.includes("invalid-action-code") || c.includes("expired")) return "This sign-in link has expired or was already used. Please request a new one.";
  if (c.includes("account-exists-with-different-credential")) return "You already signed in before with another method for this email. Please use that method.";
  if (c.includes("network")) return "Network problem. Please check your connection and try again.";
  return "Sign-in didn't work. Please try again." + (c ? ` (${c})` : "");
}

async function providerSignIn(id, msg) {
  const m = fb.mod;
  const p = id === "google" ? new m.GoogleAuthProvider() : new m.OAuthProvider(id === "microsoft" ? "microsoft.com" : "yahoo.com");
  if (id === "google") p.setCustomParameters({ prompt: "select_account" });
  try { await m.signInWithPopup(fb.auth, p); track("login", { method: id }); }
  catch (err) {
    if (/popup-blocked|operation-not-supported|web-storage/.test(err.code || "")) { store.set("nd-redirect", id); return m.signInWithRedirect(fb.auth, p); }
    msg(explain(err), "err");
  }
}

async function finishLink(email, msg) {
  try {
    await fb.mod.signInWithEmailLink(fb.auth, email, location.href);
    store.del("nd-email-link"); track("login", { method: "email_link" });
    history.replaceState(null, "", location.pathname + location.hash);
  } catch (err) { msg && msg(explain(err), "err"); }
}

function userChip(u) {
  const host = $(".strip-r"); if (!host) return;
  let c = $(".lg-user", host);
  if (!u) { c && c.remove(); return; }
  if (!c) { c = document.createElement("span"); c.className = "lg-user"; host.insertBefore(c, $("#refresh")); }
  const who = u.displayName || u.email || "Reader";
  c.innerHTML = `<span title="${esc(u.email || "")}">👤 ${esc(who.split(" ")[0])}</span><button type="button">Sign out</button>`;
  c.querySelector("button").onclick = () => fb.mod.signOut(fb.auth);
}

async function start() {
  if (PREVIEW) { gate(true); card(); return; }
  if (!CFG) return;
  gate(true);
  const [app, mod] = await Promise.all([import(CDN + "firebase-app.js"), import(CDN + "firebase-auth.js")]);
  const auth = mod.getAuth(app.initializeApp(CFG));
  auth.useDeviceLanguage();
  fb = { auth, mod, linkMode: mod.isSignInWithEmailLink(auth, location.href) };
  if (fb.linkMode) {
    const saved = store.get("nd-email-link");
    if (saved) await finishLink(saved);
  }
  try { await mod.getRedirectResult(auth).then(r => { if (r) { track("login", { method: store.get("nd-redirect") || "redirect" }); store.del("nd-redirect"); } }); } catch (e) {}
  mod.onAuthStateChanged(auth, u => {
    userChip(u);
    if (u) { gate(false); }
    else { gate(true); card(); if (fb.linkMode) { const m = $("#lg-m"); m && (m.textContent = "Enter the email address you used, to finish signing in.", m.className = "lg-msg ok"); } }
  });
}
start().catch(e => { console.error("Nirnay sign-in failed to load", e); gate(false); });
