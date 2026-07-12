import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Required for Vercel / reverse-proxy deployments
  ...(process.env.NODE_ENV === "production" && { trustHost: true }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@test.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const rateCheck = checkRateLimit(credentials.email.toLowerCase(), RATE_LIMITS.auth);
        if (!rateCheck.ok) {
          throw new Error(`Too many login attempts. Try again in ${rateCheck.retryAfterSeconds}s.`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Return user details for session token creation
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as const;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
