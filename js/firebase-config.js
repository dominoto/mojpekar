// Firebase konzola → Project settings → Your apps → Web app → SDK config.
// Ove vrijednosti su javne po dizajnu; podatke štite pravila u firestore.rules.
export const firebaseConfig = {
  apiKey: "PROMIJENI",
  authDomain: "PROMIJENI.firebaseapp.com",
  projectId: "PROMIJENI",
  appId: "PROMIJENI",
};

// Google e-mail glavnog administratora (mora biti isti kao u firestore.rules).
export const ADMIN_EMAIL = "tvoj.email@gmail.com";
