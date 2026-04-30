export type SubscriptionPlan = "FREE" | "BARBER" | "PREMIUM"

export const PLAN_LIMITS = {
  FREE: {
    maxServices: 5,
    maxProducts: 5,
    maxCombos: 3,
  },
  BARBER: {
    maxServices: 10,
    maxProducts: 10,
    maxCombos: 5,
  },
  PREMIUM: {
    maxServices: Infinity,
    maxProducts: Infinity,
    maxCombos: Infinity,
  },
} as const

export const getPlanLimits = (plan: SubscriptionPlan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE
}
