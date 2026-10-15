import { esc, initPage } from "./app.js";
import { countFoods, countLists, itemsOf, loadData, placeResults } from "./places.js";

const s = await initPage();
const data = await loadData();
const grid = document.getElementById("places");

if (!data.places.length) {
  grid.innerHTML = `<section class="card notice"><h2>Još nema mjesta</h2>
    <p>${s.canEdit ? `Dodaj prvo mjesto na stranici <a href="uredi.html">Uredi ponudu</a>.` : "Uskoro stiže prva rang lista."}</p></section>`;
} else {
  const medals = ["🥇", "🥈", "🥉"];
  grid.innerHTML = data.places.map((p) => {
    const { rows, voters } = placeResults(data, p.id);
    const top = voters
      ? `<ol class="mini-top">${rows.slice(0, 3).map((r, i) => `<li>${medals[i]} ${esc(r.name)}</li>`).join("")}</ol>`
      : `<p class="muted">Još nema rang lista.</p>`;
    return `
      <a class="place-card" href="mjesto.html?id=${encodeURIComponent(p.id)}">
        <span class="place-emoji" aria-hidden="true">${esc(p.emoji || "🍽️")}</span>
        <h2>${esc(p.name)}</h2>
        ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
        <p class="meta">${countFoods(itemsOf(data.items, p.id).length)} · ${countLists(voters)}</p>
        ${top}
        <span class="more">Pogledaj listu →</span>
      </a>`;
  }).join("");
}
