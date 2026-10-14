import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, esc, initPage, pastryImage } from "./app.js";
import { aggregate } from "./rank.js";

await initPage();

const [pastrySnap, rankingSnap] = await Promise.all([
  getDocs(collection(db, "pastries")),
  getDocs(collection(db, "rankings")),
]);
const pastries = pastrySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
const rankings = rankingSnap.docs.map((d) => d.data());
const { rows, voters } = aggregate(pastries, rankings);

const n = pastries.length;
const cakes = `${n} ${n % 10 === 1 && n % 100 !== 11 ? "kolač" : "kolača"}`;
const lists = [2, 3, 4].includes(voters % 10) && ![12, 13, 14].includes(voters % 100) ? "rang liste" : "rang lista";
const summary = document.getElementById("summary");
if (!pastries.length) {
  summary.textContent = "Pekara je još prazna — dodaj prve kolače.";
} else if (!voters) {
  summary.textContent = `${cakes} čeka prvu rang listu.`;
} else {
  summary.textContent = `${cakes} · ${voters} ${lists}`;
}

if (voters) {
  const medals = ["🥇", "🥈", "🥉"];
  document.getElementById("podium").innerHTML = rows.slice(0, 3).map((p, i) => `
    <article class="podium-item podium-${i + 1}">
      <div class="medal">${medals[i]}</div>
      ${pastryImage(p, "podium-img")}
      <h3>${esc(p.name)}</h3>
      <p class="score">${p.score.toFixed(1)} bodova</p>
      ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
    </article>`).join("");
}

if (rows.length) {
  document.getElementById("table-card").hidden = false;
  document.getElementById("rows").innerHTML = rows.map((p) => `
    <tr>
      <td class="place">${p.place}.</td>
      <td><div class="pastry-cell">${pastryImage(p)}<div><strong>${esc(p.name)}</strong>
        ${p.description ? `<small>${esc(p.description)}</small>` : ""}</div></div></td>
      <td><div class="bar-score"><span style="width:${p.score.toFixed(1)}%"></span></div>${p.score.toFixed(1)}</td>
      <td>${p.firsts || ""}</td>
    </tr>`).join("");
}
