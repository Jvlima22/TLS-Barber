// @ts-nocheck
import { PrismaAdapter } from "@auth/prisma-adapter"

import { AuthOptions } from "next-auth"
import { db } from "./prisma"
import { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
          trialEndsAt: user.trialEndsAt,
          barbershopId: user.barbershopId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.subscriptionPlan = (user as any).subscriptionPlan
        token.trialEndsAt = (user as any).trialEndsAt
        token.barbershopId = (user as any).barbershopId
      }
      return token
    },
    async session({ session, token }) {
      // Busca o estado real do plano no banco para evitar cache obsoleto na UI
      const dbUser = await db.user.findUnique({
        where: { id: token.id },
        select: { subscriptionPlan: true, trialEndsAt: true },
      })

      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
        subscriptionPlan: dbUser?.subscriptionPlan || token.subscriptionPlan,
        trialEndsAt: dbUser?.trialEndsAt || token.trialEndsAt,
        barbershopId: token.barbershopId as string,
      } as any
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async createUser({ user }) {
      // Fetch trial days from settings
      const settings = await db.settings.findFirst()
      const trialDays = settings?.trialDays ?? 15

      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionPlan: "FREE",
          trialEndsAt: trialEndsAt,
          hasUsedTrial: true,
        },
      })
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
}
