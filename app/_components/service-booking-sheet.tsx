"use client"

import { setHours, setMinutes, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { signIn, useSession } from "next-auth/react"
import { getAvailableSlots } from "../_actions/get-available-slots"
import {
  getOperatingDays,
  getOperatingExceptions,
} from "../_actions/get-operating-settings"
import { cn } from "@/app/_lib/utils"
import PaymentCheckoutDialog from "./payment-checkout-dialog"

interface ServiceBookingSheetProps {
  service: {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number
    barbershopId: string
  }
  isOpen: boolean
  onClose: () => void
}

const ServiceBookingSheet = ({
  service,
  isOpen,
  onClose,
}: ServiceBookingSheetProps) => {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [hour, setHour] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [operatingDays, setOperatingDays] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [slotsCache, setSlotsCache] = useState<Record<string, string[]>>({})

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    amount: number
    serviceName: string
    itemId: string
    type: "SERVICE" | "PRODUCT"
    metadata?: any
  } | null>(null)

  // Fetch operating settings once when component opens
  useEffect(() => {
    if (isOpen) {
      const fetchOperatingSettings = async () => {
        try {
          const [days, currentExceptions] = await Promise.all([
            getOperatingDays(service.barbershopId),
            getOperatingExceptions(service.barbershopId),
          ])
          setOperatingDays(days)
          setExceptions(currentExceptions)
        } catch (error) {
          console.error("Erro ao carregar configurações de horários:", error)
        }
      }
      fetchOperatingSettings()
    } else {
      setSelectedDate(undefined)
      setHour(undefined)
      setAvailableSlots([])
    }
  }, [isOpen, service.barbershopId])

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) return
    const dateKey = selectedDate.toDateString()

    if (slotsCache[dateKey]) {
      setAvailableSlots(slotsCache[dateKey])
      return
    }

    const fetchBookings = async () => {
      setLoading(true)
      try {
        const slots = await getAvailableSlots({
          date: selectedDate,
          barbershopId: service.barbershopId,
        })
        setAvailableSlots(slots)
        setSlotsCache((prev) => ({ ...prev, [dateKey]: slots }))
      } catch (error) {
        console.error("Erro ao carregar horários:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [selectedDate, slotsCache, service.barbershopId])

  const handleBooking = async () => {
    if (!session?.user) {
      return signIn("google")
    }

    if (!selectedDate || !hour) {
      toast.error("Por favor, selecione uma data e horário.")
      return
    }

    try {
      setLoading(true)

      const [hours, minutes] = hour.split(":").map(Number)
      const bookingDate = setHours(setMinutes(selectedDate, minutes), hours)

      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          itemId: service.id,
          type: "SERVICE",
          metadata: {
            date: bookingDate.toISOString(),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao processar agendamento")
      }

      const checkoutResponse = await response.json()

      // Se for Mercado Pago ou Mock, abrimos nosso modal profissional
      if (checkoutResponse.action === "OPEN_MODAL" || checkoutResponse.isMock) {
        setPaymentData({
          amount: Number(checkoutResponse.amount),
          serviceName: checkoutResponse.name,
          itemId: service.id,
          type: "SERVICE",
          metadata: { date: bookingDate.toISOString() },
        })
        setIsPaymentModalOpen(true)
        return
      }

      const { url } = checkoutResponse
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error initiating checkout:", error)
      toast.error("Erro ao iniciar pagamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const isDateDisabled = (date: Date) => {
    const normalizedDate = startOfDay(date)
    const today = startOfDay(new Date())

    if (normalizedDate < today) return true

    const exception = exceptions.find(
      (e) =>
        startOfDay(new Date(e.date)).getTime() === normalizedDate.getTime(),
    )
    if (exception) return !exception.isOpen

    const dayOfWeek = date.getDay()
    const standardDay = operatingDays.find((d) => d.dayOfWeek === dayOfWeek)
    if (standardDay) return !standardDay.isOpen

    return false
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90%] overflow-y-auto border-white/10 bg-[#121212] sm:w-[400px]">
        <SheetHeader className="border-b border-solid border-secondary px-5 py-6 text-left">
          <SheetTitle>Agendar {service.name}</SheetTitle>
          <SheetDescription>
            Escolha a data e o horário desejado para o seu atendimento.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-white">
              Selecione a data
            </h3>
            <div className="calendar-container">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                locale={ptBR}
                fromDate={new Date()}
                classNames={{
                  day_selected:
                    "bg-[#3EABFD] text-white hover:bg-[#3EABFD] hover:text-white rounded-xl",
                  day_disabled: "text-gray-600 opacity-20 cursor-not-allowed",
                  day_today: "bg-white/5 text-[#3EABFD] font-bold",
                }}
              />
            </div>
          </div>

          {selectedDate && (
            <div className="min-h-[150px] space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Selecione o horário
              </h3>
              {loading && availableSlots.length === 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-9 w-full animate-pulse rounded-xl bg-white/5"
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "grid grid-cols-3 gap-2 text-white transition-opacity",
                    loading ? "opacity-50" : "opacity-100",
                  )}
                >
                  {availableSlots.map((time) => {
                    const [hours, minutes] = time.split(":").map(Number)
                    const dateTime = setHours(
                      setMinutes(selectedDate, minutes),
                      hours,
                    )

                    const isPastTime =
                      selectedDate.toDateString() ===
                        new Date().toDateString() && dateTime < new Date()

                    return (
                      <Button
                        key={time}
                        variant={hour === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHour(time)}
                        disabled={isPastTime}
                        className={cn(
                          "rounded-xl text-xs text-white transition-all",
                          hour === time
                            ? "border-[#3EABFD] bg-[#3EABFD]"
                            : "border-white/10 bg-transparent hover:bg-white/5",
                        )}
                      >
                        {time}
                      </Button>
                    )
                  })}
                  {availableSlots.length === 0 && !loading && (
                    <p className="col-span-3 py-4 text-center text-xs text-gray-400">
                      Não há horários disponíveis para esta data.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full rounded-xl bg-[#3EABFD] text-white hover:bg-[#2e8acb]"
            onClick={handleBooking}
            disabled={(session?.user && (!selectedDate || !hour)) || loading}
          >
            {loading && !selectedDate
              ? "Carregando..."
              : session?.user
                ? `Agendar ${service.name.toLowerCase()}`
                : "Fazer login para agendar"}
          </Button>
        </div>
      </SheetContent>

      <PaymentCheckoutDialog
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={paymentData?.amount || 0}
        serviceName={paymentData?.serviceName || ""}
        itemId={paymentData?.itemId || ""}
        type={paymentData?.type || "SERVICE"}
        metadata={paymentData?.metadata}
      />
    </Sheet>
  )
}

export default ServiceBookingSheet
