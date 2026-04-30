"use client"

import { useState } from "react"
import {
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  InstagramIcon,
  MessageCircleIcon,
} from "lucide-react"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import Image from "next/image"
import Link from "next/link"

interface BarbershopWithSettings {
  id: string
  name: string
  settings: {
    address: string
    phones: string[]
    imageUrl: string
    instagramUrl?: string | null
    whatsappUrl?: string | null
  } | null
  operatingDays: {
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen: boolean
  }[]
}

interface BarbershopSelectorProps {
  barbershops: BarbershopWithSettings[]
}

const BarbershopSelector = ({ barbershops }: BarbershopSelectorProps) => {
  const [search, setSearch] = useState("")

  const getStatus = (barbershop: BarbershopWithSettings) => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const todaySchedule = barbershop.operatingDays.find(
      (d) => d.dayOfWeek === dayOfWeek,
    )

    if (!todaySchedule || !todaySchedule.isOpen)
      return {
        label: "Fechado",
        color: "bg-red-500/20 text-red-500 border-red-500/30",
      }

    const [startH, startM] = todaySchedule.startTime.split(":").map(Number)
    const [endH, endM] = todaySchedule.endTime.split(":").map(Number)

    const startTime = startH * 60 + startM
    const endTime = endH * 60 + endM

    if (currentTime >= startTime && currentTime < endTime) {
      return {
        label: "Aberto Agora",
        color: "bg-green-500/20 text-green-500 border-green-500/30",
      }
    }

    return {
      label: "Fechado",
      color: "bg-red-500/20 text-red-500 border-red-500/30",
    }
  }

  const filteredBarbershops = barbershops.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.settings?.address.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-5 py-10">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
          Onde vamos cuidar do{" "}
          <span className="text-[#3EABFD]">seu visual</span> hoje?
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-400">
          Selecione uma de nossas unidades para explorar serviços exclusivos e
          agendar seu horário.
        </p>

        {/* BUSCA */}
        <div className="relative mx-auto mt-10 max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Buscar por nome ou endereço..."
            className="h-14 w-full rounded-2xl border-white/10 bg-white/5 pl-12 pr-4 text-white ring-offset-transparent focus-visible:ring-1 focus-visible:ring-[#3EABFD]/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid w-full max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBarbershops.map((barbershop) => {
          const status = getStatus(barbershop)
          return (
            <Card
              key={barbershop.id}
              className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#3EABFD]/50 hover:shadow-[0_0_30px_rgba(62,171,253,0.15)]"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={
                    barbershop.settings?.imageUrl ||
                    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop"
                  }
                  alt={barbershop.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />

                <div
                  className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${status.color}`}
                >
                  {status.label}
                </div>
              </div>

              <CardContent className="relative p-6">
                <h3 className="mb-1 text-2xl font-bold text-white transition-colors group-hover:text-[#3EABFD]">
                  {barbershop.name}
                </h3>

                <div className="mb-4 flex items-start gap-2 text-gray-400">
                  <MapPinIcon className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-[#3EABFD]" />
                  <span className="line-clamp-1 text-xs leading-relaxed">
                    {barbershop.settings?.address}
                  </span>
                </div>

                {/* CONTATOS RÁPIDOS */}
                <div className="mb-6 flex flex-wrap gap-3">
                  {barbershop.settings?.phones[0] && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-[10px] text-white">
                      <PhoneIcon className="h-3 w-3 text-[#3EABFD]" />
                      {barbershop.settings.phones[0]}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {barbershop.settings?.whatsappUrl && (
                      <Link
                        href={barbershop.settings.whatsappUrl}
                        target="_blank"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 text-green-500 transition-all hover:bg-green-500 hover:text-white"
                      >
                        <MessageCircleIcon className="h-4 w-4" />
                      </Link>
                    )}
                    {barbershop.settings?.instagramUrl && (
                      <Link
                        href={barbershop.settings.instagramUrl}
                        target="_blank"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-500 transition-all hover:bg-pink-500 hover:text-white"
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>

                <Button
                  className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-[#3EABFD] to-[#2C78B2] font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  asChild
                >
                  <Link href={`/dashboard?barbershopId=${barbershop.id}`}>
                    Escolher Unidade
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredBarbershops.length === 0 && (
        <div className="mt-20 text-center">
          <p className="text-xl text-gray-500">
            Nenhuma barbearia encontrada para &quot;{search}&quot;.
          </p>
          <Button
            variant="link"
            className="mt-2 text-[#3EABFD]"
            onClick={() => setSearch("")}
          >
            Limpar busca
          </Button>
        </div>
      )}
    </div>
  )
}

export default BarbershopSelector
