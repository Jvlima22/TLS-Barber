"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { stripe } from "../_lib/stripe"

export const createStripeCheckout = async (priceId: string) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Você precisa estar logado para realizar uma assinatura.")
  }

  const userId = (session.user as any).id
  const userEmail = session.user.email

  // Cria a sessão de checkout no Stripe
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/admin/subscription?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/?status=canceled`,
    customer_email: userEmail!,
    metadata: {
      userId,
      priceId,
    },
  })

  return { sessionId: checkoutSession.id, url: checkoutSession.url }
}
