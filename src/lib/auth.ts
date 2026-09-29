import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailFromNetId, normalizeNetId } from "@/lib/validation";

// Auth.js reads AUTH_URL/NEXTAUTH_URL straight from process.env and does
// `new URL(value)` on it — a bare domain (no protocol), which is an easy
// misconfiguration to make, throws and takes down every auth-touching route.
// Normalize it defensively so that mistake degrades gracefully instead of
// 500ing the whole site.
for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
  const value = process.env[key];
  if (value && !/^https?:\/\//i.test(value)) {
    process.env[key] = `https://${value}`;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Auth.js's auto-detection of a trusted host (via process.env.VERCEL) isn't
  // reliable on every Next.js/Vercel runtime combo, and a false negative here
  // throws UntrustedHost on every request that touches auth — so set it
  // explicitly rather than relying on inference. Safe because we don't run
  // behind an untrusted reverse proxy that could spoof the Host header.
  trustHost: true,
  // Keep people signed in across visits instead of re-prompting every time
  // the JWT's default lifetime lapses.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        netId: { label: "NetID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const identifier = (credentials?.netId as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        if (!identifier || !password) return null;

        // Sign-in is by NetID. Existing accounts keep working: match the
        // derived netid@duke.edu email, the stored netId, or (for anyone who
        // still types a full address) the email exactly as stored.
        const lowered = identifier.toLowerCase();
        const netId = normalizeNetId(lowered.split("@")[0]);
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: lowered },
              { email: emailFromNetId(netId) },
              { netId: { equals: netId, mode: "insensitive" } },
            ],
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
});
