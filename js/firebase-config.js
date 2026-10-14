// Firebase konzola → Project settings → Your apps → Web app → SDK config.
// Ove vrijednosti su javne po dizajnu; podatke štite pravila u firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyA4B6QxjBHLtVjKZauQ88fGxw_6wr8Mc4k",
  authDomain: "mojpekar-43b7e.firebaseapp.com",
  projectId: "mojpekar-43b7e",
  storageBucket: "mojpekar-43b7e.firebasestorage.app",
  messagingSenderId: "467036085517",
  appId: "1:467036085517:web:411dd2dfab77e73fcce444",
};

// Google e-mail glavnog administratora (mora biti isti kao u firestore.rules).
export const ADMIN_EMAIL = "zubac76@gmail.com";
