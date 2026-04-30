"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

// Definição da interface para o usuário
interface User {
  id: string
  name?: string
  email?: string
  image?: string
}

// Atualização da interface de sessão
interface Session {
  user?: User
}

interface CreateBookingParams {
  serviceId: string
  date: Date
}

export const createBooking = async (params: CreateBookingParams) => {
  // Obtém a sessão do servidor
  const session = (await getServerSession(authOptions)) as Session

  // Verifica se o usuário está autenticado
  if (!session.user || !session.user.id) {
    throw new Error("Usuário não autenticado!")
  }

  const service = (await (db as any).service.findUnique({
    where: { id: params.serviceId },
    select: { barbershopId: true },
  })) as any

  if (!service) {
    throw new Error("Serviço não encontrado")
  }

  await (db as any).booking.create({
    data: {
      userId: (session.user as any).id,
      serviceId: params.serviceId,
      date: params.date,
      barbershopId: service.barbershopId,
    },
  })

  // Revalida o caminho para atualizar a página com a nova reserva
  revalidatePath("/barbershops/[id]")
}
