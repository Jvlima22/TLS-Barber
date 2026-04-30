// @ts-nocheck
"use server"

import { db } from "../_lib/prisma"
import bcrypt from "bcryptjs"

export const registerUser = async (data: any) => {
  const { name, email, password, barbershopName, userType = "BARBER" } = data

  if (!name || !email || !password) {
    return { error: "Todos os campos são obrigatórios." }
  }

  // If it's a barber, barbershopName is required
  if (userType === "BARBER" && !barbershopName) {
    return { error: "O nome da barbearia é obrigatório para barbeiros." }
  }

  const userExists = await db.user.findUnique({
    where: { email },
  })

  if (userExists) {
    return { error: "Este e-mail já está em uso." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const result = await db.$transaction(async (tx) => {
      let barbershopId = null

      if (userType === "BARBER") {
        // Generate slug from barbershopName
        const slug = barbershopName
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")

        const slugExists = await tx.barbershop.findUnique({
          where: { slug },
        })

        const finalSlug = slugExists
          ? `${slug}-${Math.floor(Math.random() * 1000)}`
          : slug

        // 1. Create Barbershop
        const barbershop = await tx.barbershop.create({
          data: {
            name: barbershopName,
            slug: finalSlug,
          },
        })

        barbershopId = barbershop.id

        // 2. Create Default Settings
        await tx.settings.create({
          data: {
            barbershopId: barbershop.id,
            name: barbershopName,
            address: "Endereço da Barbearia",
            description: "Bem-vindo à nossa barbearia!",
            imageUrl:
              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop",
            phones: [],
            trialDays: 15,
          },
        })

        // 3. Create Default Operating Days
        const days = [0, 1, 2, 3, 4, 5, 6]
        await tx.operatingDay.createMany({
          data: days.map((day) => ({
            barbershopId: barbershop.id,
            dayOfWeek: day,
            isOpen: day !== 0,
          })),
        })
      }

      // Calculate trial for Barbers
      const trialDays = 15
      const trialEndsAt = userType === "BARBER" ? new Date() : null
      if (trialEndsAt) trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

      // Create User
      await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          subscriptionPlan: userType === "BARBER" ? "FREE" : null,
          trialEndsAt: trialEndsAt,
          hasUsedTrial: userType === "BARBER",
          role: userType === "BARBER" ? "ADMIN" : "USER",
          barbershopId: barbershopId,
        },
      })

      return { success: true }
    })

    return result
  } catch (error) {
    console.error(error)
    return { error: "Erro ao criar conta." }
  }
}
