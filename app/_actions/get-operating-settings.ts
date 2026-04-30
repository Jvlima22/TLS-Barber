"use server"

import { db } from "../_lib/prisma"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getOperatingDays = async (barbershopId?: string) => {
  let finalBarbershopId = barbershopId

  if (!finalBarbershopId) {
    const session = await getServerSession(authOptions)
    finalBarbershopId = (session?.user as any)?.barbershopId
  }

  if (!finalBarbershopId) return []

  return await (db as any).operatingDay.findMany({
    where: { barbershopId: finalBarbershopId },
    orderBy: {
      dayOfWeek: "asc",
    },
  })
}

export const getOperatingExceptions = async (barbershopId?: string) => {
  let finalBarbershopId = barbershopId

  if (!finalBarbershopId) {
    const session = await getServerSession(authOptions)
    finalBarbershopId = (session?.user as any)?.barbershopId
  }

  if (!finalBarbershopId) return []

  return await (db as any).operatingException.findMany({
    where: { barbershopId: finalBarbershopId },
    orderBy: {
      date: "asc",
    },
  })
}
