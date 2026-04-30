"use client"

import { ArrowRight, Check } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { createStripeCheckout } from "@/app/_actions/create-stripe-checkout"

interface PricingCardsProps {
  userId?: string
  currentPlan?: string
  initialPrices?: {
    barber: number | null
    premium: number | null
  } | null
}

const PricingCards = ({ currentPlan, initialPrices }: PricingCardsProps) => {
  const handleSubscribe = async (planName: string) => {
    if (planName === "Gratuito") return

    const priceIds: Record<string, string | undefined> = {
      "Plano Barber": process.env.NEXT_PUBLIC_STRIPE_BARBER_PRICE_ID,
      "Plano Premium": process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    }

    const priceId = priceIds[planName]

    if (!priceId) {
      return toast.error("Configuração de preço não encontrada.")
    }

    try {
      toast.loading("Iniciando checkout...")
      const { url } = await createStripeCheckout(priceId)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast.dismiss()
      toast.error("Erro ao conectar com o Stripe.")
    }
  }

  const plans = [
    {
      id: "FREE",
      name: "Gratuito",
      price: "0",
      description: "Experimente todo o poder do sistema sem compromisso.",
      features: [
        "15 Dias de Acesso Total",
        "Agenda Online",
        "Gestão de Clientes",
        "Suporte via Email",
      ],
      cta:
        currentPlan === "FREE" || !currentPlan
          ? "Seu Plano Atual"
          : "Começar Teste Grátis",
      highlighted: false,
      disabled: currentPlan === "FREE" || !currentPlan,
    },
    {
      id: "BARBER",
      name: "Plano Barber",
      price: initialPrices?.barber ? initialPrices.barber.toString() : "89,99", // Fallback caso o servidor falhe
      description: "O equilíbrio perfeito para barbearias em crescimento.",
      features: [
        "Tudo do Gratuito",
        "Gestão de Equipe",
        "Relatórios Financeiros",
        "Lembretes Automáticos",
        "Suporte Prioritário",
      ],
      cta:
        currentPlan === "BARBER" ? "Seu Plano Atual" : "Assinar Plano Barber",
      highlighted: true,
      disabled: currentPlan === "BARBER",
    },
    {
      id: "PREMIUM",
      name: "Plano Premium",
      price: initialPrices?.premium ? initialPrices.premium.toString() : "297",
      description: "A solução definitiva para barbearias de elite.",
      features: [
        "Tudo do Barber",
        "Pagamentos Online",
        "PDV & Estoque",
        "Marketing Integrado",
        "Gerente de Conta",
      ],
      cta:
        currentPlan === "PREMIUM" ? "Seu Plano Atual" : "Assinar Plano Premium",
      highlighted: false,
      disabled: currentPlan === "PREMIUM",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {plans.map((plan, index) => (
        <div
          key={index}
          className={`relative rounded-3xl border p-8 transition-all duration-500 hover:scale-[1.02] ${plan.highlighted ? "border-[#2C78B2] bg-[#1A1A1A] shadow-2xl shadow-[#2C78B2]/10" : "border-white/5 bg-[#151515] hover:border-white/10"}`}
        >
          {plan.highlighted && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#2C78B2] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Mais Popular
            </div>
          )}
          <div className="mb-8">
            <h3 className="mb-2 text-xl font-bold text-white">{plan.name}</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              {plan.description}
            </p>
          </div>
          <div className="mb-8 flex items-baseline">
            <span className="mr-1 text-lg text-gray-400">R$</span>
            <span className="text-4xl font-extrabold text-white">
              {plan.price}
            </span>
            <span className="ml-2 text-sm text-gray-500">/mês</span>
          </div>
          <Button
            onClick={() => handleSubscribe(plan.name)}
            disabled={plan.disabled}
            className={`mb-10 w-full rounded-xl py-6 text-sm font-bold transition-all ${plan.highlighted ? "bg-[#2C78B2] text-white shadow-xl shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"}`}
          >
            {plan.cta}
            {!plan.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <ul className="space-y-4">
            {plan.features.map((feature, fIndex) => (
              <li
                key={fIndex}
                className="flex items-center gap-3 text-sm text-gray-400"
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${plan.highlighted ? "bg-[#2C78B2]/20 text-[#2C78B2]" : "bg-white/5 text-gray-500"}`}
                >
                  <Check size={12} />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default PricingCards
