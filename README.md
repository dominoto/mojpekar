# Moj Pekar 🍰

Rang lista kolača (cakes). A static site (GitHub Pages) with Firebase for Google login and the database.

| Page | Who |
|---|---|
| `index.html` – cumulative ranking | everyone, no login |
| `rangiraj.html` – my ranking (drag & drop) | colleagues added by an admin |
| `kolaci.html` – add/edit cakes | admins + users with the "Kolači" right |
| `korisnici.html` – manage users and rights | admins |

**Ranking method:** Borda count. On each list, a cake at position *i* earns *n − i* points. Cakes a user hasn't ranked yet (e.g. new ones) share the bottom places. Each user's points are scaled to 0–100 and then averaged.

**Security:** login is Google only, so there are no passwords and Google handles bot protection. Anyone can sign in, but only emails an admin has added can rank, and every write is checked server-side by `firestore.rules`.

## Setup (one time, ~10 min)

1. **Firebase project:** already created (`mojpekar-43b7e`).
2. **Google login:** *Build → Authentication → Get started → Sign-in method → Google → Enable*.
   Under *Settings → Authorized domains*, add `dominoto.github.io`.
3. **Database:** *Build → Firestore Database → Create database* (production mode, region e.g. `eur3`).
   Open the *Rules* tab, paste the contents of `firestore.rules` (admin email is already set), and click *Publish*.
4. **Web config:** already done — your values are in `js/firebase-config.js`.
5. **GitHub Pages:**
   ```sh
   gh auth login                       # log in as dominoto
   gh repo create mojpekar --public --source=. --push
   gh api -X POST repos/dominoto/mojpekar/pages -f "source[branch]=main" -f "source[path]=/"
   ```
   The site will be live at **https://dominoto.github.io/mojpekar/** within a minute or two.

## Local testing

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
(`localhost` is already an authorized domain in Firebase.)

## Changes to the rules

If you edit `firestore.rules`, paste it into the Firebase console again (or `firebase deploy --only firestore:rules` if you use the Firebase CLI).
