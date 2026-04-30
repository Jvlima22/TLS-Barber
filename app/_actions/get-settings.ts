"use server"

import { db } from "../_lib/prisma"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getSettings = async () => {
  const session = await getServerSession(authOptions)
  const barbershopId = (session?.user as any)?.barbershopId

  if (!barbershopId) return null

  const settings = await (db as any).settings.findFirst({
    where: { barbershopId },
  })
  return settings
}
