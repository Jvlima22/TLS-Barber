import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/app/_lib/stripe"
import { db } from "@/app/_lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as any

  // Quando o pagamento da assinatura é concluído com sucesso
  if (event.type === "checkout.session.completed") {
    let userId = session.metadata.userId
    const priceId = session.metadata.priceId
    const customerId = session.customer
    const userEmail = session.customer_details?.email || session.customer_email

    // Fallback: Se não tiver userId, busca pelo e-mail
    if (!userId && userEmail) {
      const users: any[] = await db.$queryRawUnsafe(
        `SELECT "id" FROM "User" WHERE "email" = $1`,
        userEmail,
      )
      if (users.length > 0) {
        userId = users[0].id
        const planMapping: Record<string, string> = {
          [(process.env.STRIPE_BARBER_PRICE_ID || "").trim()]: "BARBER",
          [(process.env.STRIPE_PREMIUM_PRICE_ID || "").trim()]: "PREMIUM",
        }

        const activePlan = planMapping[priceId]

        // Se o plano no banco estiver desatualizado, sincroniza agora!
        if (activePlan) {
          await db.$executeRawUnsafe(
            `UPDATE "User" SET "subscriptionPlan" = $1::"SubscriptionPlan", "stripeCustomerId" = $2 WHERE "id" = $3`,
            activePlan,
            customerId,
            userId,
          )
        }
      }
    } else if (userId) {
      const planMapping: Record<string, string> = {
        [(process.env.STRIPE_BARBER_PRICE_ID || "").trim()]: "BARBER",
        [(process.env.STRIPE_PREMIUM_PRICE_ID || "").trim()]: "PREMIUM",
      }

      const planName = planMapping[priceId] || "FREE"

      await db.$executeRawUnsafe(
        `UPDATE "User" SET "subscriptionPlan" = $1::"SubscriptionPlan", "stripeCustomerId" = $2 WHERE "id" = $3`,
        planName,
        customerId,
        userId,
      )
    }
  }

  // Quando a assinatura é atualizada ou renovada
  if (event.type === "customer.subscription.updated") {
    // Lógica adicional para renovação se necessário
  }

  // Quando a assinatura é cancelada
  if (event.type === "customer.subscription.deleted") {
    // Buscar usuário pelo Stripe Customer ID e voltar para FREE
  }

  return new NextResponse(null, { status: 200 })
}
