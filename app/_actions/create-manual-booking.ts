"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { setHours, setMinutes } from "date-fns"

interface CreateManualBookingParams {
  userId: string
  serviceId?: string
  comboId?: string
  date: Date
  hour: string
}

export const createManualBooking = async (
  params: CreateManualBookingParams,
) => {
  const session = await getServerSession(authOptions)

  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error(
      "Acesso negado. Apenas administradores podem criar agendamentos manuais.",
    )
  }

  const [hours, minutes] = params.hour.split(":").map(Number)
  const bookingDate = setHours(setMinutes(params.date, minutes), hours)

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const barbershopId = (session.user as any).barbershopId

  // Verificar se já existe agendamento no mesmo horário
  const existingBooking = await (db as any).booking.findFirst({
    where: {
      date: bookingDate,
      barbershopId,
    },
  })

  if (existingBooking) {
    throw new Error("Já existe um agendamento para este horário.")
  }

  await (db as any).booking.create({
    data: {
      serviceId: params.serviceId,
      comboId: params.comboId,
      userId: params.userId,
      date: bookingDate,
      paymentStatus: "SUCCEEDED",
      barbershopId,
    },
  })

  revalidatePath("/admin")
}
