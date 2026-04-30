"use server"

import { db } from "@/app/_lib/prisma"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getBanks = async () => {
  const session = await getServerSession(authOptions)
  const barbershopId = (session?.user as any)?.barbershopId

  if (!barbershopId) return []

  return await (db as any).bank.findMany({
    where: { barbershopId },
    include: {
      credentials: {
        select: {
          id: true,
          isEnabled: true,
          environment: true,
          isDefault: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })
}
