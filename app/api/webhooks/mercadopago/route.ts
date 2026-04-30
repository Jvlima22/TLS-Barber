import { NextResponse } from "next/server"
import { db } from "@/app/_lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("[MercadoPago Webhook Body]:", JSON.stringify(body, null, 2))

    // O Mercado Pago envia o ID do recurso e o tipo (ex: payment)
    const { type, data } = body

    if (type === "payment" && data?.id) {
      // Chamamos a API do MP para pegar os detalhes reais do pagamento e confirmar o status
      // No momento do Webhook, consultamos o banco de credenciais para pegar o token
      const activeCredential = (await db.bankCredential.findFirst({
        where: { bank: { provider: "MERCADO_PAGO" } },
      })) as any

      if (!activeCredential) {
        console.warn("[MP Webhook] Credencial ativa não encontrada.")
        return NextResponse.json({ received: true })
      }

      // Import dinâmico ou direto do decrypt para evitar circular dependência
      const { decrypt } = await import("@/app/_lib/encryption")
      const accessToken = decrypt(activeCredential.clientSecret)

      const res = await fetch(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (!res.ok) {
        console.error("[MP Webhook] Erro ao consultar pagamento:", data.id)
        return NextResponse.json({ received: true })
      }

      const payment = await res.json()

      if (payment.status === "approved") {
        const metadata = payment.metadata
        if (!metadata) return NextResponse.json({ received: true })

        const {
          user_id,
          item_id,
          type: itemType,
          date,
          barbershop_id,
        } = metadata

        if (itemType === "SERVICE") {
          if (item_id.startsWith("combined_")) {
            const ids = item_id.replace("combined_", "").split("_")
            for (const id of ids) {
              await db.booking.create({
                data: {
                  userId: user_id,
                  serviceId: id,
                  date: new Date(date),
                  paymentStatus: "SUCCEEDED",
                  barbershopId: barbershop_id,
                } as any,
              })
            }
          } else {
            // Verificar se é Serviço ou Combo
            const service = await db.service.findUnique({
              where: { id: item_id },
            })
            if (service) {
              await db.booking.create({
                data: {
                  userId: user_id,
                  serviceId: item_id,
                  date: new Date(date),
                  paymentStatus: "SUCCEEDED",
                  barbershopId: barbershop_id,
                } as any,
              })
            } else {
              await db.booking.create({
                data: {
                  userId: user_id,
                  comboId: item_id,
                  date: new Date(date),
                  paymentStatus: "SUCCEEDED",
                  barbershopId: barbershop_id,
                } as any,
              })
            }
          }
          console.log(
            `[MP Webhook] Reservas processadas para usuário ${user_id}`,
          )
        } else if (itemType === "PRODUCT") {
          await db.purchase.create({
            data: {
              userId: user_id,
              productId: item_id,
              paymentStatus: "SUCCEEDED",
              barbershopId: barbershop_id,
            } as any,
          })
          console.log(
            `[MP Webhook] Compra de produto criada para usuário ${user_id}`,
          )
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[MP Webhook Error]:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
