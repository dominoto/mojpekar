import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/modular/sortable.esm.js";
import { db, esc, initPage, pastryImage, toast } from "./app.js";

const s = await initPage("member");
if (s) {
  const list = document.getElementById("my-list");
  const status = document.getElementById("status");

  const [pastrySnap, mine] = await Promise.all([
    getDocs(collection(db, "pastries")),
    getDoc(doc(db, "rankings", s.email)),
  ]);
  const pastries = new Map(pastrySnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const saved = (mine.exists() ? mine.data().order : []).filter((id) => pastries.has(id));
  const fresh = [...pastries.keys()].filter((id) => !saved.includes(id));

  if (!pastries.size) {
    list.outerHTML = `<p class="muted">Još nema peciva za rangiranje.</p>`;
    document.getElementById("save").hidden = true;
  }

  list.innerHTML = [...saved, ...fresh].map((id) => {
    const p = pastries.get(id);
    const isNew = mine.exists() && fresh.includes(id);
    return `
      <li data-id="${esc(id)}">
        <span class="handle" aria-hidden="true">⠿</span>
        <span class="pos"></span>
        ${pastryImage(p)}
        <span class="name">${esc(p.name)} ${isNew ? '<em class="badge">novo</em>' : ""}</span>
        <span class="arrows">
          <button class="icon-btn" data-move="-1" aria-label="Pomakni gore">▲</button>
          <button class="icon-btn" data-move="1" aria-label="Pomakni dolje">▼</button>
        </span>
      </li>`;
  }).join("");

  const renumber = () => list.querySelectorAll(".pos").forEach((el, i) => { el.textContent = `${i + 1}.`; });
  const dirty = () => { renumber(); status.textContent = "Nespremljene promjene"; };
  renumber();
  status.textContent = mine.exists()
    ? (fresh.length ? "Ima novih peciva — smjesti ih i spremi." : "Lista je spremljena.")
    : "Još nisi spremio/la svoju listu.";

  Sortable.create(list, {
    animation: 150, ghostClass: "ghost", filter: ".icon-btn", preventOnFilter: false,
    delay: 150, delayOnTouchOnly: true, onEnd: dirty,
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-move]");
    if (!btn) return;
    const li = btn.closest("li");
    if (btn.dataset.move === "-1" && li.previousElementSibling) li.previousElementSibling.before(li);
    if (btn.dataset.move === "1" && li.nextElementSibling) li.nextElementSibling.after(li);
    dirty();
  });

  document.getElementById("save").addEventListener("click", async () => {
    const order = [...list.children].map((li) => li.dataset.id);
    try {
      await setDoc(doc(db, "rankings", s.email), { order, name: s.name, updatedAt: serverTimestamp() });
      list.querySelectorAll(".badge").forEach((b) => b.remove());
      status.textContent = "Lista je spremljena.";
      toast("Spremljeno! 🥐");
    } catch {
      toast("Spremanje nije uspjelo.", "err");
    }
  });
}
