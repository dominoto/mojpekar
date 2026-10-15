import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export function safeUrl(url) {
  return /^https:\/\//i.test(url || "") ? url : "";
}

export function pastryImage(p, cls = "thumb", emoji = "🍽️") {
  const url = safeUrl(p.imageUrl);
  return url
    ? `<img class="${cls}" src="${esc(url)}" alt="" loading="lazy">`
    : `<span class="${cls} thumb-emoji" aria-hidden="true">${esc(emoji)}</span>`;
}

export function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 3000);
}

function currentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
  });
}

async function loadSession() {
  const user = await currentUser();
  if (!user) return { user: null };
  const email = user.email.toLowerCase();
  const snap = await getDoc(doc(db, "users", email));
  const profile = snap.exists() ? snap.data() : null;
  const isSuper = email === ADMIN_EMAIL.toLowerCase();
  const isAdmin = isSuper || profile?.isAdmin === true;
  return {
    user,
    email,
    name: profile?.name || user.displayName || email,
    isMember: isSuper || !!profile,
    isAdmin,
    canEdit: isAdmin || profile?.canEditPastries === true,
  };
}

function renderHeader(s) {
  let here = location.pathname.split("/").pop() || "index.html";
  if (here === "mjesto.html") here = "index.html";
  const link = (href, label) =>
    `<a href="${href}" class="${here === href ? "active" : ""}">${label}</a>`;
  const links = [link("index.html", "Rang liste")];
  if (s.isMember) links.push(link("rangiraj.html", "Moje liste"));
  if (s.canEdit) links.push(link("uredi.html", "Uredi ponudu"));
  if (s.isAdmin) links.push(link("korisnici.html", "Korisnici"));

  const account = s.user
    ? `<span class="who">${esc(s.name)}</span><button class="btn btn-ghost" id="logout">Odjava</button>`
    : `<button class="btn btn-light" id="login">Prijava s Googleom</button>`;

  document.getElementById("site-header").innerHTML = `
    <div class="awning" aria-hidden="true"></div>
    <div class="bar">
      <a href="index.html" class="brand"><span class="brand-icon">🥖</span> Moj Pekar</a>
      <nav>${links.join("")}</nav>
      <div class="account">${account}</div>
    </div>`;

  document.getElementById("login")?.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      location.reload();
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") toast("Prijava nije uspjela.", "err");
    }
  });
  document.getElementById("logout")?.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "index.html";
  });
}

/**
 * Prikaže zaglavlje i provjeri prava. need: null | "member" | "editor" | "admin".
 * Vraća sesiju ili null ako korisnik nema pristup (tada je poruka već prikazana).
 */
export async function initPage(need = null) {
  const s = await loadSession();
  renderHeader(s);
  const ok = !need
    || (need === "member" && s.isMember)
    || (need === "editor" && s.canEdit)
    || (need === "admin" && s.isAdmin);
  if (!ok) {
    document.querySelector("main").innerHTML = `
      <section class="card notice">
        <h2>Nemaš pristup ovoj stranici</h2>
        <p>${s.user
          ? "Tvoj račun još nije odobren za ovo. Javi se administratoru."
          : "Prijavi se svojim Google računom (gumb gore desno)."}</p>
      </section>`;
    return null;
  }
  return s;
}
