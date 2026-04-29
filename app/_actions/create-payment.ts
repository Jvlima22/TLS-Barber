"use server"

import { db } from "@/app/_lib/prisma"
import { createMercadoPagoPayment } from "./create-mercadopago-payment"
import { createItauPayment } from "./create-itau-payment"

export async function createPayment(params: {
  itemId: string
  type: "SERVICE" | "PRODUCT"
  method: "pix" | "card"
  metadata?: any
}) {
  // 1. Encontrar o banco habilitado para o site (priorizando o habilitado)
  const credential = await db.bankCredential.findFirst({
    where: { isEnabled: true },
    include: { bank: true },
  })

  if (!credential) {
    throw new Error("Nenhum banco configurado e ativo.")
  }

  const provider = credential.bank.provider

  if (provider === "MERCADO_PAGO") {
    return await createMercadoPagoPayment(params)
  }

  if (provider === "ITAU") {
    if (params.method === "card") {
      throw new Error(
        "Itaú suporta apenas pagamentos via Pix nesta integração.",
      )
    }
    return await createItauPayment({ ...params, method: "pix" })
  }

  throw new Error(`Integração para o banco ${provider} não disponível.`)
}
