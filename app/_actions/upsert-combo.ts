"use server"

import { db } from "@/app/_lib/prisma"
import { comboSchema } from "../admin/_schemas"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { getPlanLimits } from "../_lib/subscription-limits"

export const upsertCombo = async (params: {
  id?: string
  name: string
  description: string
  imageUrl: string
  price?: number
  service1Id: string
  service2Id: string
}) => {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  const { id, name, description, imageUrl, price, service1Id, service2Id } =
    comboSchema.parse(params)

  let finalPrice = price

  if (!finalPrice || finalPrice <= 0) {
    // Fetch services to calculate total price
    const [service1, service2] = await Promise.all([
      db.service.findUnique({ where: { id: service1Id } }),
      db.service.findUnique({ where: { id: service2Id } }),
    ])

    if (!service1 || !service2) {
      throw new Error("Serviços não encontrados")
    }

    finalPrice = Number(service1.price) + Number(service2.price)
  }

  const barbershopId = (session.user as any).barbershopId

  // VERIFICAÇÃO DE LIMITES DO PLANO
  if (!id) {
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: { subscriptionPlan: true },
    })

    const count = await db.combo.count({
      where: { barbershopId },
    })

    const limits = getPlanLimits(user?.subscriptionPlan as any)

    if (count >= limits.maxCombos) {
      throw new Error(
        `Você atingiu o limite de ${limits.maxCombos} combos do seu plano.`,
      )
    }
  }

  if (id) {
    await (db as any).combo.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        price: finalPrice,
        service1Id,
        service2Id,
        barbershopId,
      },
    })
  } else {
    await (db as any).combo.create({
      data: {
        name,
        description,
        imageUrl,
        price: finalPrice,
        service1Id,
        service2Id,
        barbershopId,
      },
    })
  }

  revalidatePath("/admin")
  revalidatePath("/")
}
