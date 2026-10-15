import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, esc } from "./app.js";
import { aggregate } from "./rank.js";

// Kolači uneseni prije uvođenja mjesta nemaju placeId, a stare rang liste imaju
// samo polje `order`. Sve to pripada ovom mjestu, pa postojeći podaci rade bez migracije.
export const LEGACY_ID = "kolaci";
const LEGACY_PLACE = { id: LEGACY_ID, name: "Kolači", emoji: "🍰", description: "" };

export async function loadData() {
  const [placeSnap, itemSnap, rankingSnap] = await Promise.all([
    getDocs(collection(db, "places")),
    getDocs(collection(db, "pastries")),
    getDocs(collection(db, "rankings")),
  ]);
  const items = itemSnap.docs.map((d) => ({ id: d.id, ...d.data(), placeId: d.data().placeId || LEGACY_ID }));
  const places = placeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!places.some((p) => p.id === LEGACY_ID) && items.some((i) => i.placeId === LEGACY_ID)) {
    places.push({ ...LEGACY_PLACE });
  }
  places.sort((a, b) => a.name.localeCompare(b.name, "hr"));
  const rankings = rankingSnap.docs.map((d) => ({ email: d.id, ...d.data() }));
  return { places, items, rankings };
}

export function orderFor(ranking, placeId) {
  return ranking?.orders?.[placeId] ?? (placeId === LEGACY_ID ? ranking?.order ?? [] : []);
}

export function itemsOf(items, placeId) {
  return items.filter((i) => i.placeId === placeId);
}

export function placeResults(data, placeId) {
  return aggregate(
    itemsOf(data.items, placeId),
    data.rankings.map((r) => ({ order: orderFor(r, placeId) })),
  );
}

/** Mjesto iz ?id= u adresi, inače prvo mjesto. */
export function currentPlace(places) {
  const id = new URLSearchParams(location.search).get("id");
  return places.find((p) => p.id === id) || places[0] || null;
}

export function placeTabs(places, current, page, extra = "") {
  return `<nav class="tabs">${places.map((p) => `
    <a href="${page}?id=${encodeURIComponent(p.id)}" class="${p.id === current?.id ? "active" : ""}">
      <span aria-hidden="true">${esc(p.emoji || "🍽️")}</span> ${esc(p.name)}</a>`).join("")}${extra}</nav>`;
}

export function tierOf(score) {
  return score >= 80 ? "S" : score >= 60 ? "A" : score >= 40 ? "B" : score >= 20 ? "C" : "D";
}

export function countFoods(n) {
  return `${n} ${n % 10 === 1 && n % 100 !== 11 ? "jelo" : "jela"}`;
}

export function countLists(n) {
  return `${n} ${[2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "rang liste" : "rang lista"}`;
}
