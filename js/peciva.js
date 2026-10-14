import {
  addDoc, collection, deleteDoc, doc, getDocs, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, esc, initPage, pastryImage, toast } from "./app.js";

const s = await initPage("editor");
if (s) {
  const form = document.getElementById("pastry-form");
  const listEl = document.getElementById("pastry-list");
  let pastries = [];
  let editingId = null;

  async function load() {
    const snap = await getDocs(collection(db, "pastries"));
    pastries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name, "hr"));
    listEl.innerHTML = pastries.map((p) => `
      <li>
        ${pastryImage(p)}
        <div class="grow"><strong>${esc(p.name)}</strong>${p.description ? `<small>${esc(p.description)}</small>` : ""}</div>
        <button class="btn btn-small btn-ghost" data-edit="${esc(p.id)}">Uredi</button>
        ${s.isAdmin ? `<button class="btn btn-small btn-danger" data-delete="${esc(p.id)}">Obriši</button>` : ""}
      </li>`).join("") || `<li class="muted">Još nema peciva.</li>`;
  }

  function setEditing(p) {
    editingId = p?.id ?? null;
    form.reset();
    if (p) for (const k of ["name", "description", "imageUrl"]) form.elements[k].value = p[k] || "";
    document.getElementById("form-title").textContent = p ? `Uređivanje: ${p.name}` : "Novo pecivo";
    document.getElementById("submit").textContent = p ? "Spremi promjene" : "Dodaj pecivo";
    document.getElementById("cancel").hidden = !p;
    if (p) form.scrollIntoView({ behavior: "smooth" });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: form.elements.name.value.trim(),
      description: form.elements.description.value.trim(),
      imageUrl: form.elements.imageUrl.value.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: s.email,
    };
    if (!data.name) return;
    try {
      if (editingId) await updateDoc(doc(db, "pastries", editingId), data);
      else await addDoc(collection(db, "pastries"), { ...data, createdAt: serverTimestamp() });
      toast(editingId ? "Promjene spremljene." : "Pecivo dodano! 🥨");
      setEditing(null);
      await load();
    } catch {
      toast("Spremanje nije uspjelo.", "err");
    }
  });

  document.getElementById("cancel").addEventListener("click", () => setEditing(null));

  listEl.addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit]");
    if (edit) return setEditing(pastries.find((p) => p.id === edit.dataset.edit));
    const del = e.target.closest("[data-delete]");
    if (del) {
      const p = pastries.find((x) => x.id === del.dataset.delete);
      if (!confirm(`Obrisati "${p.name}"? Nestat će i iz svih rang lista.`)) return;
      await deleteDoc(doc(db, "pastries", p.id));
      toast("Pecivo obrisano.");
      await load();
    }
  });

  await load();
}
