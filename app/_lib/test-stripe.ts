// @ts-nocheck
import Stripe from "stripe"
import dotenv from "dotenv"

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
})

async function testConnection() {
  console.log("🚀 Iniciando teste de conexão com Stripe...")

  try {
    const account = await stripe.accounts.retrieve()
    console.log("✅ Conexão estabelecida com sucesso!")
    console.log(
      `📍 Conta: ${account.settings?.dashboard.display_name || "TLS Barber"}`,
    )

    console.log("\n📦 Buscando seus produtos...")
    const products = await stripe.products.list({ limit: 10 })

    if (products.data.length === 0) {
      console.log("⚠️ Nenhum produto encontrado na sua conta Stripe.")
    } else {
      for (const product of products.data) {
        console.log(`---`)
        console.log(`Nome: ${product.name}`)
        console.log(`Product ID: ${product.id}`)

        // Buscar o preço padrão do produto
        if (product.default_price) {
          const price = await stripe.prices.retrieve(
            product.default_price as string,
          )
          console.log(`Price ID (USE ESTE NO .ENV): ${price.id}`)
          console.log(`Valor: R$ ${(price.unit_amount || 0) / 100}`)
        } else {
          console.log("⚠️ Este produto não tem um preço padrão configurado.")
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Erro na conexão:")
    console.error(`Mensagem: ${error.message}`)
  }
}

testConnection()
