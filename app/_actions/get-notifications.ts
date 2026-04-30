"use server"

import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getNotifications = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { bookings: [], purchases: [] }
  }

  const barbershopId = (session.user as any).barbershopId

  if (!barbershopId) {
    return { bookings: [], purchases: [] }
  }

  const [bookings, purchases] = await Promise.all([
    (db as any).booking.findMany({
      where: { barbershopId },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        service: true,
        combo: true,
      },
    }),
    (db as any).purchase.findMany({
      where: { barbershopId },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        product: true,
      },
    }) as Promise<any[]>,
  ])

  // Convert Decimals to Numbers to avoid hydration issues
  const sanitizedBookings = bookings.map((b: any) => ({
    ...b,
    service: b.service
      ? { ...b.service, price: Number(b.service.price) }
      : null,
    combo: b.combo ? { ...b.combo, price: Number(b.combo.price) } : null,
  }))

  const sanitizedPurchases = purchases.map((p) => ({
    ...p,
    product: { ...p.product, price: Number(p.product.price) },
  }))

  return {
    bookings: sanitizedBookings,
    purchases: sanitizedPurchases,
  }
}
