/**
 * Zbirna rang lista (Borda). Svaka lista daje pecivu na mjestu i (od 0) n − i bodova,
 * gdje je n broj svih peciva. Peciva koja korisnik nije rangirao (npr. nova) dijele
 * preostala mjesta na dnu, pa dobivaju prosjek tih bodova. Bodovi se po korisniku
 * svode na 0–100, a konačni rezultat je prosjek svih predanih lista.
 */
export function aggregate(pastries, rankings) {
  const n = pastries.length;
  const stats = new Map(pastries.map((p) => [p.id, { pastry: p, sum: 0, firsts: 0 }]));
  const norm = (pts) => (n > 1 ? ((pts - 1) / (n - 1)) * 100 : 100);
  let voters = 0;

  for (const r of rankings) {
    const order = [...new Set(r.order || [])].filter((id) => stats.has(id));
    if (!order.length) continue;
    voters++;
    const ranked = new Set(order);
    order.forEach((id, i) => { stats.get(id).sum += norm(n - i); });
    stats.get(order[0]).firsts++;
    const leftover = norm((n - order.length + 1) / 2);
    for (const [id, st] of stats) if (!ranked.has(id)) st.sum += leftover;
  }

  const rows = [...stats.values()]
    .map((st) => ({ ...st.pastry, score: voters ? st.sum / voters : 0, firsts: st.firsts }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "hr"));

  // Jednaki rezultati dijele isto mjesto.
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    row.place = prev && prev.score.toFixed(1) === row.score.toFixed(1) ? prev.place : i + 1;
  });

  return { rows, voters };
}
