import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "STUDENT" | "ADMIN";
      verified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "STUDENT" | "ADMIN";
    verified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "STUDENT" | "ADMIN";
    verified?: boolean;
  }
}
