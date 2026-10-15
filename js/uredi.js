import {
  addDoc, collection, deleteDoc, doc, setDoc, updateDoc, writeBatch, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, esc, initPage, pastryImage, toast } from "./app.js";
import { itemsOf, loadData, placeTabs } from "./places.js";

const s = await initPage("editor");
if (s) {
  const data = await loadData();
  const id = new URLSearchParams(location.search).get("id");
  const place = id === "novo" ? null : data.places.find((p) => p.id === id) || data.places[0] || null;
  const reload = (placeId) => { location.href = `uredi.html?id=${encodeURIComponent(placeId)}`; };

  const newTab = `<a href="uredi.html?id=novo" class="${place ? "" : "active"}">＋ Novo mjesto</a>`;
  document.getElementById("tabs").innerHTML = placeTabs(data.places, place, "uredi.html", newTab);

  // ---------- mjesto ----------
  const placeForm = document.getElementById("place-form");
  if (place) {
    document.getElementById("place-title").textContent = "Mjesto";
    document.getElementById("place-submit").textContent = "Spremi mjesto";
    for (const k of ["name", "emoji", "description"]) placeForm.elements[k].value = place[k] || "";
    document.getElementById("delete-place").hidden = !s.isAdmin;
  }

  placeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = {
      name: placeForm.elements.name.value.trim(),
      emoji: placeForm.elements.emoji.value.trim() || "🍽️",
      description: placeForm.elements.description.value.trim(),
      updatedAt: serverTimestamp(),
    };
    try {
      if (place) {
        // setDoc + merge: radi i za mjesto "Kolači" koje još nema svoj dokument
        await setDoc(doc(db, "places", place.id), fields, { merge: true });
        reload(place.id);
      } else {
        const ref = await addDoc(collection(db, "places"), { ...fields, createdAt: serverTimestamp() });
        reload(ref.id);
      }
    } catch {
      toast("Spremanje nije uspjelo.", "err");
    }
  });

  document.getElementById("delete-place").addEventListener("click", async () => {
    const items = itemsOf(data.items, place.id);
    if (!confirm(`Obrisati mjesto "${place.name}" i svih ${items.length} jela u njemu?`)) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "places", place.id));
    for (const i of items) batch.delete(doc(db, "pastries", i.id));
    await batch.commit();
    location.href = "uredi.html";
  });

  // ---------- jela ----------
  if (place) {
    const emoji = place.emoji || "🍽️";
    const form = document.getElementById("pastry-form");
    const listEl = document.getElementById("pastry-list");
    const items = itemsOf(data.items, place.id).sort((a, b) => a.name.localeCompare(b.name, "hr"));
    let editingId = null;

    document.getElementById("item-card").hidden = false;
    document.getElementById("list-card").hidden = false;
    document.getElementById("list-title").textContent = `Jela: ${place.name}`;

    listEl.innerHTML = items.map((p) => `
      <li>
        ${pastryImage(p, "thumb", emoji)}
        <div class="grow"><strong>${esc(p.name)}</strong>${p.description ? `<small>${esc(p.description)}</small>` : ""}</div>
        <button class="btn btn-small btn-ghost" data-edit="${esc(p.id)}">Uredi</button>
        ${s.isAdmin ? `<button class="btn btn-small btn-danger" data-delete="${esc(p.id)}">Obriši</button>` : ""}
      </li>`).join("") || `<li class="muted">Ovdje još nema jela.</li>`;

    const setEditing = (p) => {
      editingId = p?.id ?? null;
      form.reset();
      if (p) for (const k of ["name", "description", "imageUrl"]) form.elements[k].value = p[k] || "";
      document.getElementById("form-title").textContent = p ? `Uređivanje: ${p.name}` : "Novo jelo";
      document.getElementById("submit").textContent = p ? "Spremi promjene" : "Dodaj jelo";
      document.getElementById("cancel").hidden = !p;
      if (p) form.scrollIntoView({ behavior: "smooth" });
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = {
        name: form.elements.name.value.trim(),
        description: form.elements.description.value.trim(),
        imageUrl: form.elements.imageUrl.value.trim(),
        placeId: place.id,
        updatedAt: serverTimestamp(),
        updatedBy: s.email,
      };
      if (!fields.name) return;
      try {
        if (editingId) await updateDoc(doc(db, "pastries", editingId), fields);
        else await addDoc(collection(db, "pastries"), { ...fields, createdAt: serverTimestamp() });
        reload(place.id);
      } catch {
        toast("Spremanje nije uspjelo.", "err");
      }
    });

    document.getElementById("cancel").addEventListener("click", () => setEditing(null));

    listEl.addEventListener("click", async (e) => {
      const edit = e.target.closest("[data-edit]");
      if (edit) return setEditing(items.find((p) => p.id === edit.dataset.edit));
      const del = e.target.closest("[data-delete]");
      if (del) {
        const p = items.find((x) => x.id === del.dataset.delete);
        if (!confirm(`Obrisati "${p.name}"? Nestat će i iz svih rang lista.`)) return;
        await deleteDoc(doc(db, "pastries", p.id));
        reload(place.id);
      }
    });
  }
}
