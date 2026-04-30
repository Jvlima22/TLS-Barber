"use server"

import { stripe } from "../_lib/stripe"

export const getStripePrices = async () => {
  const barberPriceId = (process.env.STRIPE_BARBER_PRICE_ID || "").trim()
  const premiumPriceId = (process.env.STRIPE_PREMIUM_PRICE_ID || "").trim()

  if (!barberPriceId || !premiumPriceId) {
    return null
  }

  try {
    const [barberPrice, premiumPrice] = await Promise.all([
      stripe.prices.retrieve(barberPriceId),
      stripe.prices.retrieve(premiumPriceId),
    ])

    return {
      barber: (barberPrice.unit_amount || 0) / 100,
      premium: (premiumPrice.unit_amount || 0) / 100,
    }
  } catch (error) {
    console.error("Erro ao buscar preços do Stripe:", error)
    return null
  }
}
