"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
  CopyIcon,
  QrCodeIcon,
  CreditCardIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { createPayment } from "@/app/_actions/create-payment"
import Image from "next/image"

interface PaymentCheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  serviceName: string
  itemId: string
  type: "SERVICE" | "PRODUCT"
  metadata?: any
}

const PaymentCheckoutDialog = ({
  isOpen,
  onClose,
  amount,
  serviceName,
  itemId,
  type,
  metadata,
}: PaymentCheckoutDialogProps) => {
  const [method, setMethod] = useState<"pix" | "card" | null>(null)
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<{
    qrCode: string
    base64: string
  } | null>(null)

  const handleCreatePayment = async (selectedMethod: "pix" | "card") => {
    setLoading(true)
    setMethod(selectedMethod)

    try {
      const result = await createPayment({
        itemId,
        type,
        method: selectedMethod,
        metadata,
      })

      if (selectedMethod === "pix" && (result as any).qrCode) {
        setPixData({
          qrCode: (result as any).qrCode,
          base64: (result as any).qrCodeBase64,
        })
        setLoading(false)
      } else if (selectedMethod === "card" && (result as any).url) {
        setLoading(true) // Mantém o spinner até a mudança de página
        window.location.href = (result as any).url
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pagamento")
      setMethod(null)
      setLoading(false)
    }
  }

  const handleCopyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode)
      toast.success("Código PIX copiado!")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        if (!loading) {
          setMethod(null)
          setPixData(null)
          onClose()
        }
      }}
    >
      <DialogContent className="w-[95%] max-w-md rounded-3xl border-white/10 bg-[#1A1A1A] p-8 sm:w-full">
        <DialogHeader className="flex flex-col items-center text-center">
          <DialogTitle className="text-2xl font-black text-white">
            Checkout Profissional
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecione como deseja pagar pelo serviço{" "}
            <strong className="text-[#00FF00]">{serviceName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 text-center">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
              Valor Total
            </h3>
            <p className="text-4xl font-black text-white">
              R$ {amount.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {!method ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCreatePayment("pix")}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#222] p-6 transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <QrCodeIcon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-white">
                  Pagar com PIX
                </span>
              </button>

              <button
                onClick={() => handleCreatePayment("card")}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#222] p-6 transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                  <CreditCardIcon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-white">
                  Pagar com Cartão
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {loading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm font-medium text-gray-400">
                    Gerando seu pagamento...
                  </p>
                </div>
              ) : pixData ? (
                <div className="flex w-full flex-col items-center gap-6 duration-300 animate-in fade-in zoom-in">
                  <div className="group relative">
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-blue-600 opacity-25 blur transition duration-1000 group-hover:opacity-50 group-hover:duration-200" />
                    <div className="relative h-56 w-56 overflow-hidden rounded-2xl bg-white p-4 shadow-2xl">
                      <Image
                        src={`data:image/png;base64,${pixData.base64}`}
                        alt="QR Code PIX"
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-white/10 bg-white/5 font-bold text-white hover:bg-white/10"
                      onClick={handleCopyPix}
                    >
                      <CopyIcon className="h-4 w-4" />
                      Copiar Código Copia e Cola
                    </Button>
                    <p className="text-center text-[10px] uppercase tracking-tighter text-gray-500">
                      O pagamento será compensado instantaneamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <AlertCircleIcon className="h-10 w-10 text-red-500" />
                  <p className="text-center text-sm text-gray-400">
                    Houve um imprevisto. Tente outro método ou reinicie.
                  </p>
                  <Button variant="ghost" onClick={() => setMethod(null)}>
                    Escolher outro
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 border-t border-white/5 pt-6 opacity-30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Pagamento Processado com Segurança
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentCheckoutDialog
