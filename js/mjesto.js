import { esc, initPage, pastryImage } from "./app.js";
import {
  countFoods, countLists, currentPlace, loadData, placeResults, placeTabs, tierOf,
} from "./places.js";

await initPage();
const data = await loadData();
const place = currentPlace(data.places);

if (!place) {
  document.querySelector("main").innerHTML = `<section class="card notice"><h2>Još nema mjesta</h2></section>`;
} else {
  const emoji = place.emoji || "🍽️";
  document.title = `${place.name} — Moj Pekar`;
  document.getElementById("tabs").innerHTML = placeTabs(data.places, place, "mjesto.html");
  document.getElementById("place-emoji").textContent = emoji;
  document.getElementById("place-name").textContent = place.name;

  const { rows, voters } = placeResults(data, place.id);
  document.getElementById("summary").textContent = !rows.length
    ? "Ovdje još nema jela."
    : voters ? `${countFoods(rows.length)} · ${countLists(voters)}` : `${countFoods(rows.length)} čeka prvu rang listu.`;

  if (voters) {
    const medals = ["🥇", "🥈", "🥉"];
    document.getElementById("podium").innerHTML = rows.slice(0, 3).map((p, i) => `
      <article class="podium-item podium-${i + 1}">
        <div class="medal">${medals[i]}</div>
        ${pastryImage(p, "podium-img", emoji)}
        <h3>${esc(p.name)}</h3>
        <p class="score">${p.score.toFixed(1)} bodova</p>
        ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
      </article>`).join("");
  }

  if (rows.length) {
    document.getElementById("table-card").hidden = false;
    document.getElementById("rows").innerHTML = rows.map((p) => {
      const tier = voters ? tierOf(p.score) : "";
      return `
      <tr>
        <td class="place">${p.place}.</td>
        <td><div class="pastry-cell">${pastryImage(p, "thumb", emoji)}<div><strong>${esc(p.name)}</strong>
          ${p.description ? `<small>${esc(p.description)}</small>` : ""}</div></div></td>
        <td>${tier ? `<span class="tier tier-${tier}">${tier}</span>` : ""}</td>
        <td><div class="bar-score"><span style="width:${p.score.toFixed(1)}%"></span></div>${p.score.toFixed(1)}</td>
        <td>${p.firsts || ""}</td>
      </tr>`;
    }).join("");
  }
}
