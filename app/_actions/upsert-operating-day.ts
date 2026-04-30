"use server"

import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface UpsertOperatingDayProps {
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
}

export const upsertOperatingDay = async (props: UpsertOperatingDayProps) => {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Acesso negado")
  }

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const barbershopId = (session.user as any).barbershopId

  return await (db as any).operatingDay.upsert({
    where: {
      barbershopId_dayOfWeek: {
        barbershopId,
        dayOfWeek: props.dayOfWeek,
      },
    },
    update: { ...props, barbershopId },
    create: { ...props, barbershopId },
  })

  revalidatePath("/admin")
  revalidatePath("/")
}
