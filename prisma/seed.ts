// prisma/seed.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Tipagem para contornar erros de TypeScript
const prismaExtended = prisma as any

async function main() {
  // 1. Configurações da barbearia (Settings - singleton com ID 1)
  await prismaExtended.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "TGL Barber",
      address: "Rua Exemplo, 123 - Centro, Cidade",
      phones: ["(11) 99999-9999", "(11) 3888-8888"],
      description:
        "A melhor barbearia da região com cortes modernos e produtos premium.",
      imageUrl: "/barbershop/main.jpg",
    },
  })

  console.log("Configurações da barbearia inseridas/atualizadas.")

  // 2. Lista de serviços (agora em tabela Service, sem barbershopId)
  const services = [
    {
      name: "Corte degradê",
      description: "Corte degradê moderno e estiloso.",
      imageUrl: "/services/corte-degrade.jpg",
      price: 50,
    },
    {
      name: "Corte social",
      description: "Corte social clássico.",
      imageUrl: "/services/corte-social.jpg",
      price: 40,
    },
    {
      name: "Corte disfarçado",
      description: "Corte disfarçado com acabamento.",
      imageUrl: "/services/corte-disfarcado.jpg",
      price: 45,
    },
    {
      name: "Sobrancelha",
      description: "Design de sobrancelha.",
      imageUrl: "/services/sobrancelha.jpg",
      price: 10,
    },
    {
      name: "Barba",
      description: "Barba completa e alinhada.",
      imageUrl: "/services/barba.jpg",
      price: 40,
    },
    {
      name: "Alisamento",
      description: "Alisamento a partir de R$30.",
      imageUrl: "/services/alisamento.jpg",
      price: 30,
    },
    {
      name: "Progressiva",
      description: "Progressiva a partir de R$60.",
      imageUrl: "/services/progressiva.jpg",
      price: 60,
    },
  ]

  // 3. Lista de produtos (novos itens para venda)
  const products = [
    {
      name: "Pomada modeladora",
      description: "Pomada modeladora tradicional.",
      imageUrl: "/products/pomada-modeladora.jpg",
      price: 20,
    },
    {
      name: "Pomada modeladora Black",
      description: "Pomada modeladora Black.",
      imageUrl: "/products/pomada-black.jpg",
      price: 17,
    },
    {
      name: "Gel cola/black",
      description: "Gel cola/black.",
      imageUrl: "/products/gel-cola.jpg",
      price: 12,
    },
  ]

  // Inserir serviços (usando upsert para evitar duplicatas)
  for (const service of services) {
    await prismaExtended.service.upsert({
      where: { name: service.name }, // upsert por nome único
      update: {
        description: service.description,
        imageUrl: service.imageUrl,
        price: service.price,
      },
      create: service,
    })
  }

  console.log("Serviços inseridos/atualizados com sucesso!")

  // Inserir produtos (usando upsert por nome)
  for (const product of products) {
    await prismaExtended.product.upsert({
      where: { name: product.name }, // upsert por nome único
      update: {
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
      },
      create: product,
    })
  }

  console.log("Produtos inseridos/atualizados com sucesso!")

  // 4. Lista de Bancos suportados
  const banks = [
    {
      name: "Bradesco Net Empresa",
      provider: "BRADESCO",
      imageUrl: "/banks/bradesco.png",
      isActive: true,
    },
    {
      name: "Mercado Pago",
      provider: "MERCADO_PAGO",
      imageUrl: "/banks/mercado-pago.png",
      isActive: true,
    },
    {
      name: "PicPay Negócios",
      provider: "PICPAY",
      imageUrl: "/banks/picpay.png",
      isActive: false, // "Em breve"
    },
  ]

  for (const bank of banks) {
    await prismaExtended.bank.upsert({
      where: { provider: bank.provider },
      update: {
        name: bank.name,
        isActive: bank.isActive,
      },
      create: bank,
    })
  }

  console.log("Bancos inseridos/atualizados com sucesso!")

  console.log(
    "Seed concluído! Banco de dados populado com configurações, serviços, produtos e bancos.",
  )
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
