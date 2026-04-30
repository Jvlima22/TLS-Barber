"use client"

import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { useState } from "react"
import ServiceBookingSheet from "./service-booking-sheet"
import ItemDetailsDialog from "./item-details-dialog"

interface CombinedServiceItemProps {
  service: {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number
    barbershopId: string
    services: Array<{
      id: string
      name: string
      description: string
      imageUrl: string
      price: number
    }>
  }
}

const CombinedServiceItem = ({ service }: CombinedServiceItemProps) => {
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  // Format the service to match Prisma Service type
  const formattedService = {
    id: service.id,
    name: service.name,
    description: service.description,
    imageUrl: service.imageUrl,
    price: service.price,
    barbershopId: service.barbershopId,
  }

  const handleBookingClick = () => {
    setIsBookingSheetOpen(true)
  }

  return (
    <>
      <Card
        className="w-[167px] min-w-[167px] flex-shrink-0 cursor-pointer rounded-2xl transition-all hover:border-[#3EABFD]/50 lg:w-[280px]"
        onClick={() => setIsDetailsDialogOpen(true)}
      >
        <CardContent className="p-0 px-1 pt-1">
          {/* IMAGEM */}
          <div className="relative h-[159px] w-full lg:h-[240px]">
            <Image
              alt={service.name}
              fill
              className="rounded-2xl object-cover"
              src={service.imageUrl}
            />
          </div>

          {/* TEXTO */}
          <div className="px-1 py-3">
            <h3 className="truncate text-sm font-semibold text-white">
              {service.name}
            </h3>
            <p className="truncate text-xs text-gray-400">
              {service.description}
            </p>
            <p className="text-xs font-bold" style={{ color: "#3EABFD" }}>
              R$ {service.price.toFixed(2)}
            </p>
            <Button
              variant="secondary"
              className="mt-3 w-full rounded-xl bg-[#102332] hover:bg-[#3EABFD]"
              onClick={(e) => {
                e.stopPropagation()
                handleBookingClick()
              }}
            >
              <span className="text-xs text-white">Agendar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ItemDetailsDialog
        item={{
          ...service,
          type: "combo",
        }}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onAction={handleBookingClick}
      />

      <ServiceBookingSheet
        service={formattedService}
        isOpen={isBookingSheetOpen}
        onClose={() => setIsBookingSheetOpen(false)}
      />
    </>
  )
}

export default CombinedServiceItem
