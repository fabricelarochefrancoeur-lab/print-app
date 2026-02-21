import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { authLimiter } from "./ratelimit";
import { audit } from "./audit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const forwarded = req?.headers?.["x-forwarded-for"];
        const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "unknown";
        try {
          await authLimiter.consume(ip);
        } catch {
          throw new Error("Too many login attempts. Try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          await audit("LOGIN_FAILED", ip);
          throw new Error("No user found with this email");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          await audit("LOGIN_FAILED", ip, user.id);
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
