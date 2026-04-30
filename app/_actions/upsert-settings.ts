// @ts-nocheck
"use server"

import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"
import { settingsSchema, SettingsSchema } from "../admin/_schemas"

export const upsertSettings = async (data: SettingsSchema) => {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Acesso negado")
  }

  const validatedData = settingsSchema.parse(data)

  const barbershopId = (session.user as any).barbershopId

  await db.settings.upsert({
    where: { barbershopId },
    update: {
      name: validatedData.name,
      address: validatedData.address,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      startHour: validatedData.startHour,
      endHour: validatedData.endHour,
      phones: validatedData.phones || [],
      trialDays: validatedData.trialDays || 15,
      instagramUrl: validatedData.instagramUrl || "",
      whatsappUrl: validatedData.whatsappUrl || "",
    },
    create: {
      barbershopId,
      name: validatedData.name,
      address: validatedData.address,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      startHour: validatedData.startHour,
      endHour: validatedData.endHour,
      phones: validatedData.phones || [],
      trialDays: validatedData.trialDays || 15,
      instagramUrl: validatedData.instagramUrl || "",
      whatsappUrl: validatedData.whatsappUrl || "",
    },
  })

  revalidatePath("/admin")
  revalidatePath("/")
}
