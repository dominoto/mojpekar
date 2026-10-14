import {
  collection, deleteDoc, doc, getDocs, setDoc, updateDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, esc, initPage, toast } from "./app.js";

const s = await initPage("admin");
if (s) {
  const form = document.getElementById("user-form");
  const listEl = document.getElementById("user-list");

  async function load() {
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((d) => ({ email: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name, "hr"));
    listEl.innerHTML = users.map((u) => `
      <li data-email="${esc(u.email)}">
        <span class="avatar">${esc(u.name.charAt(0).toUpperCase())}</span>
        <div class="grow"><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></div>
        <label class="check"><input type="checkbox" data-field="canEditPastries" ${u.canEditPastries ? "checked" : ""}> Kolači</label>
        <label class="check"><input type="checkbox" data-field="isAdmin" ${u.isAdmin ? "checked" : ""}> Admin</label>
        <button class="btn btn-small btn-danger" data-remove>Ukloni</button>
      </li>`).join("") || `<li class="muted">Još nema dodanih kolega.</li>`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.elements.email.value.trim().toLowerCase();
    try {
      await setDoc(doc(db, "users", email), {
        name: form.elements.name.value.trim(),
        canEditPastries: form.elements.canEditPastries.checked,
        isAdmin: form.elements.isAdmin.checked,
      });
      toast("Korisnik spremljen.");
      form.reset();
      await load();
    } catch {
      toast("Spremanje nije uspjelo.", "err");
    }
  });

  listEl.addEventListener("change", async (e) => {
    const box = e.target.closest("[data-field]");
    if (!box) return;
    const email = box.closest("li").dataset.email;
    try {
      await updateDoc(doc(db, "users", email), { [box.dataset.field]: box.checked });
      toast("Prava ažurirana.");
    } catch {
      box.checked = !box.checked;
      toast("Promjena nije uspjela.", "err");
    }
  });

  listEl.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-remove]")) return;
    const email = e.target.closest("li").dataset.email;
    if (!confirm(`Ukloniti ${email}? Njegova/njezina rang lista bit će obrisana.`)) return;
    await Promise.all([deleteDoc(doc(db, "users", email)), deleteDoc(doc(db, "rankings", email))]);
    toast("Korisnik uklonjen.");
    await load();
  });

  await load();
}
