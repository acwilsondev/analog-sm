import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/shell/db/client";
import { rateLimit } from "@/shell/ratelimit";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // 10 login attempts per 15 minutes per IP
        const ip =
          (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0].trim() ??
          (req?.headers?.['x-real-ip'] as string) ??
          'unknown';
        if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      } else if (token.sub) {
        // Re-fetch role from DB so demotions take effect immediately,
        // and detect hard-deleted (banned) users.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (!dbUser) {
          (token as any).invalid = true;
          return token;
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as any).invalid) {
        return { ...session, user: undefined } as typeof session;
      }
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
