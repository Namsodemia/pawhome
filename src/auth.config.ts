import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;

      const requiresAuth =
        path === "/app" ||
        path.startsWith("/app/") ||
        (path.startsWith("/api/") &&
          !path.startsWith("/api/auth") &&
          !path.startsWith("/api/register"));

      const isAuthPage = path === "/login" || path === "/register";

      if (requiresAuth && !isLoggedIn) {
        return false;
      }
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/app", request.nextUrl));
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
