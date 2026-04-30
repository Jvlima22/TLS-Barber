"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"

export const getAdminSummary = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  const barbershopId = (session.user as any).barbershopId

  const [
    bookings,
    purchases,
    services,
    products,
    combos,
    users,
    settings,
    operatingDays,
    operatingExceptions,
  ] = await Promise.all([
    (db as any).booking.findMany({
      where: { barbershopId },
      include: {
        user: true,
        service: true,
        combo: true,
      } as any,
      orderBy: {
        date: "desc",
      },
    }),
    (db as any).purchase.findMany({
      where: { barbershopId },
      include: {
        user: true,
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    (db as any).service.findMany({
      where: { barbershopId },
    }),
    (db as any).product.findMany({
      where: { barbershopId },
    }),
    (db as any).combo.findMany({
      where: { barbershopId },
      include: {
        service1: true,
        service2: true,
      },
    }),
    (db as any).user.findMany({
      where: {
        role: "USER",
      },
      orderBy: {
        name: "asc",
      },
    }),
    (db as any).settings.findFirst({
      where: { barbershopId },
    }),
    (db as any).operatingDay.findMany({
      where: { barbershopId },
      orderBy: { dayOfWeek: "asc" },
    }),
    (db as any).operatingException.findMany({
      where: { barbershopId },
      orderBy: { date: "asc" },
    }),
  ])

  return {
    bookings: bookings.map((b: any) => ({
      ...b,
      service: b.service
        ? { ...b.service, price: Number(b.service.price) }
        : null,
      combo: b.combo ? { ...b.combo, price: Number(b.combo.price) } : null,
    })),
    purchases: purchases.map((p: any) => ({
      ...p,
      product: { ...p.product, price: Number(p.product.price) },
    })),
    services: services.map((s: any) => ({ ...s, price: Number(s.price) })),
    products: products.map((p: any) => ({ ...p, price: Number(p.price) })),
    combos: combos.map((c: any) => ({
      ...c,
      price: Number(c.price),
      service1: { ...c.service1, price: Number(c.service1.price) },
      service2: { ...c.service2, price: Number(c.service2.price) },
    })),
    users,
    settings,
    operatingDays,
    operatingExceptions,
  }
}
