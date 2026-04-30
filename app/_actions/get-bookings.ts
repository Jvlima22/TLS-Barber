"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingsProps {
  serviceId: string
  date: Date
}

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getBookings = async ({ date }: GetBookingsProps) => {
  const session = await getServerSession(authOptions)
  const barbershopId = (session?.user as any)?.barbershopId

  if (!barbershopId) return []

  return (db as any).booking.findMany({
    where: {
      barbershopId,
      date: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
  })
}
