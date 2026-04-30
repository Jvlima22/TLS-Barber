import { getSubscriptionData } from "@/app/_actions/get-subscription-data"
import { getStripePrices } from "@/app/_actions/get-stripe-prices"
import { ShieldCheck } from "lucide-react"
import PricingCards from "@/app/_components/pricing-cards"
import Header from "@/app/_components/header"
import { format } from "date-fns"

const SubscriptionPage = async () => {
  // Busca todos os dados em paralelo no SERVIDOR antes de renderizar a página
  const [subscription, stripePrices] = await Promise.all([
    getSubscriptionData(),
    getStripePrices(),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header />

      <div className="container mx-auto flex-1 space-y-10 p-6 lg:p-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Gerenciar Assinatura
          </h1>
          <p className="text-gray-400">
            Controle seu plano e visualize seus detalhes de faturamento.
          </p>
        </div>

        {/* Card de Status Unificado */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#151515] p-8">
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-md">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">
                  Status da Assinatura
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${subscription?.subscriptionPlan === "FREE" ? "bg-gray-500/20 text-gray-400" : "bg-[#2C78B2]/20 text-[#2C78B2]"}`}
                >
                  {subscription?.subscriptionPlan || "FREE"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {subscription?.subscriptionPlan === "FREE"
                  ? "Você está no plano gratuito. Faça upgrade para liberar recursos exclusivos e remover limites."
                  : "Sua assinatura está ativa e você tem acesso total aos recursos do plano selecionado."}
              </p>
            </div>

            {subscription?.details && (
              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8 md:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Valor Mensal
                  </p>
                  <p className="text-xl font-bold text-white">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(subscription.details.amount)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Próxima Fatura
                  </p>
                  <p className="text-xl font-bold text-white">
                    {subscription.details.currentPeriodEnd &&
                    !isNaN(
                      new Date(subscription.details.currentPeriodEnd).getTime(),
                    )
                      ? format(
                          new Date(subscription.details.currentPeriodEnd),
                          "dd/MM",
                        )
                      : "--/--"}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Pagamento
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-medium uppercase text-gray-400">
                      {subscription.details.cardBrand}
                    </span>
                    <span className="text-xl font-bold text-white">
                      •••• {subscription.details.cardLast4}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#2C78B2]/5 to-transparent" />
            <ShieldCheck className="absolute -bottom-4 -right-4 h-32 w-32 -rotate-12 text-white/[0.02]" />
          </div>
        </div>

        <div className="space-y-8 border-t border-white/5 pt-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                Planos Disponíveis
              </h2>
              <p className="text-sm text-gray-400">
                Escolha o plano ideal para a evolução do seu negócio.
              </p>
            </div>
          </div>
          {/* Passa os preços já carregados do servidor */}
          <PricingCards
            currentPlan={subscription?.subscriptionPlan}
            initialPrices={stripePrices}
          />
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage
