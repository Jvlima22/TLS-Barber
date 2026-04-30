"use server"

import { db } from "@/app/_lib/prisma"
import { productSchema } from "../admin/_schemas"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { getPlanLimits } from "../_lib/subscription-limits"

export const upsertProduct = async (params: {
  id?: string
  name: string
  description: string
  imageUrl: string
  price: number
}) => {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  const { id, name, description, imageUrl, price } = productSchema.parse(params)

  const barbershopId = (session.user as any).barbershopId

  // VERIFICAÇÃO DE LIMITES DO PLANO
  if (!id) {
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: { subscriptionPlan: true },
    })

    const count = await db.product.count({
      where: { barbershopId },
    })

    const limits = getPlanLimits(user?.subscriptionPlan as any)

    if (count >= limits.maxProducts) {
      throw new Error(
        `Você atingiu o limite de ${limits.maxProducts} produtos do seu plano.`,
      )
    }
  }

  if (id) {
    await (db as any).product.update({
      where: { id, barbershopId },
      data: { name, description, imageUrl, price },
    })
  } else {
    await (db as any).product.create({
      data: { name, description, imageUrl, price, barbershopId },
    })
  }

  revalidatePath("/admin")
  revalidatePath("/products")
  revalidatePath("/")
}
