"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface CreatePurchaseParams {
  productId: string
  quantity: number
}

export const createPurchase = async (params: CreatePurchaseParams) => {
  const session = await getServerSession(authOptions)

  if (!session?.user || !(session.user as any).id) {
    throw new Error("Usuário não autenticado!")
  }

  const product = await db.product.findUnique({
    where: { id: params.productId },
    select: { barbershopId: true },
  })

  if (!product) {
    throw new Error("Produto não encontrado!")
  }

  await db.purchase.create({
    data: {
      productId: params.productId,
      quantity: params.quantity,
      userId: (session.user as any).id,
      barbershopId: product.barbershopId,
    },
  })

  revalidatePath("/")
  revalidatePath("/admin")
}
