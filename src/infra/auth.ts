import { ExpressAuth, getSession, type ExpressAuthConfig } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma.js";
import { readConfig } from "./config.js";
import Nodemailer from "@auth/core/providers/nodemailer";
import type { Request, Response, NextFunction } from "express";
import type { Session, User } from "@auth/core/types";
import type { AdapterUser } from "@auth/core/adapters";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cfg = readConfig();

export interface AuthSession extends Session {
  user: User & {
    id: string;
    role: string;
  };
}

export const authConfig: ExpressAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user }: any) {
      if (!user.email) return false;
      
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      // Allow if user already exists and is active
      if (dbUser) {
        return dbUser.isActive;
      }

      // Check for targeted invite
      const invite = await prisma.invite.findFirst({
        where: {
          email: user.email,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (invite) {
        return true;
      }

      return false; 
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, user }: any) {
      if (session.user) {
        const authUser = user as AdapterUser & { role: string };
        session.user.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = authUser.role;
      }
      return session;
    },
  },
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createUser({ user }: any) {
      if (!user.email) return;

      const invite = await prisma.invite.findFirst({
        where: {
          email: user.email,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (invite) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { role: invite.role },
          }),
          prisma.invite.update({
            where: { id: invite.id },
            data: { 
              usedAt: new Date(),
              useCount: { increment: 1 }
            },
          }),
          prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "MEMBER_REGISTERED_VIA_INVITE",
              details: { inviteId: invite.id },
            },
          }),
        ]);
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
};

export const authHandler = ExpressAuth(authConfig);

export interface AuthenticatedRequest extends Request {
  session: AuthSession;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = await getSession(req, authConfig);
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  (req as AuthenticatedRequest).session = session as AuthSession;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const session = await getSession(req, authConfig);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any)?.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  (req as AuthenticatedRequest).session = session as AuthSession;
  next();
};
