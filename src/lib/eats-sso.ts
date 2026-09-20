import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Named "eats" (not the default app) so this never collides if DKU Life
// ever needs its own separate Firebase project down the line.
let eatsApp: App | null = null;

function getEatsAdminApp(): App {
  const existing = eatsApp ?? getApps().find((a) => a.name === "eats");
  if (existing) {
    eatsApp = existing;
    return existing;
  }

  const projectId = process.env.EATS_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.EATS_FIREBASE_CLIENT_EMAIL;
  // Vercel env vars can't hold real newlines cleanly, so the key is stored
  // with literal "\n" sequences and unescaped here.
  const privateKey = process.env.EATS_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("DKU Eats SSO isn't configured (missing EATS_FIREBASE_* env vars)");
  }

  eatsApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "eats");
  return eatsApp;
}

/**
 * Mints a Firebase custom token for the DKU Eats project, scoped to the
 * given DKU Life user id (used directly as the Firebase uid — Firebase
 * creates the matching auth record on first sign-in with that uid).
 */
export async function mintEatsSsoToken(uid: string): Promise<string> {
  const app = getEatsAdminApp();
  return getAuth(app).createCustomToken(uid);
}
