import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/modular/sortable.esm.js";
import { db, esc, initPage, pastryImage, toast } from "./app.js";
import { currentPlace, itemsOf, loadData, orderFor, placeTabs } from "./places.js";

const s = await initPage("member");
if (s) {
  const data = await loadData();
  const place = currentPlace(data.places);
  const list = document.getElementById("my-list");
  const status = document.getElementById("status");
  const saveBtn = document.getElementById("save");

  if (!place) {
    list.outerHTML = `<p class="muted">Još nema mjesta za rangiranje.</p>`;
    saveBtn.hidden = true;
  } else {
    const emoji = place.emoji || "🍽️";
    document.getElementById("tabs").innerHTML = placeTabs(data.places, place, "rangiraj.html");
    document.getElementById("place-name").textContent = `${emoji} ${place.name}`;

    const items = new Map(itemsOf(data.items, place.id).map((i) => [i.id, i]));
    const mine = data.rankings.find((r) => r.email === s.email);
    const saved = orderFor(mine, place.id).filter((id) => items.has(id));
    const hasSaved = saved.length > 0;
    const fresh = [...items.keys()].filter((id) => !saved.includes(id));

    if (!items.size) {
      list.outerHTML = `<p class="muted">Ovdje još nema jela za rangiranje.</p>`;
      saveBtn.hidden = true;
    } else {
      list.innerHTML = [...saved, ...fresh].map((id) => {
        const p = items.get(id);
        const isNew = hasSaved && fresh.includes(id);
        return `
          <li data-id="${esc(id)}">
            <span class="handle" aria-hidden="true">⠿</span>
            <span class="pos"></span>
            ${pastryImage(p, "thumb", emoji)}
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
      status.textContent = hasSaved
        ? (fresh.length ? "Ima novih jela — smjesti ih i spremi." : "Lista je spremljena.")
        : "Još nisi spremio/la listu za ovo mjesto.";

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

      saveBtn.addEventListener("click", async () => {
        const order = [...list.children].map((li) => li.dataset.id);
        try {
          // merge: liste za ostala mjesta ostaju netaknute
          await setDoc(doc(db, "rankings", s.email),
            { orders: { [place.id]: order }, name: s.name, updatedAt: serverTimestamp() }, { merge: true });
          list.querySelectorAll(".badge").forEach((b) => b.remove());
          status.textContent = "Lista je spremljena.";
          toast(`Spremljeno! ${emoji}`);
        } catch {
          toast("Spremanje nije uspjelo.", "err");
        }
      });
    }
  }
}
