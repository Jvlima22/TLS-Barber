"use client"

import { Service } from "@prisma/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Trash2Icon } from "lucide-react"
import { deleteService } from "@/app/_actions/delete-service"
import { toast } from "sonner"
import { useState } from "react"
import UpsertServiceDialog from "./upsert-service-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog"

import { getPlanLimits } from "@/app/_lib/subscription-limits"

interface ServicesTableProps {
  services: Service[]
  subscriptionPlan: string
}

const ServicesTable = ({ services, subscriptionPlan }: ServicesTableProps) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const limits = getPlanLimits(subscriptionPlan as any)
  const isLimitReached = services.length >= limits.maxServices

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteService(id)
      toast.success("Serviço excluído com sucesso!")
    } catch (error) {
      toast.error("Erro ao excluir serviço.")
    }
  }

  const handleCardClick = (service: Service) => {
    setSelectedService(service)
    setIsDialogOpen(true)
  }

  return (
    <Card className="border-white/10 bg-[#1A1A1A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[clamp(1rem,4vw,1.25rem)] text-white lg:text-xl">
          Gerenciar serviços
        </CardTitle>
        <div className="w-fit">
          <UpsertServiceDialog
            disabled={isLimitReached}
            disabledMessage={`Limite de ${limits.maxServices} atingido`}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Cards */}
        <div className="flex flex-col gap-4 lg:hidden">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#222] p-4"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex flex-1 cursor-pointer flex-col gap-1"
                  onClick={() => handleCardClick(service)}
                >
                  <h3 className="font-bold text-white">{service.name}</h3>
                  <span className="text-sm font-semibold text-[#3EABFD]">
                    {Number(service.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-white/10 bg-[#1A1A1A] text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Esta ação não pode ser desfeita. Isso excluirá
                          permanentemente o serviço &quot;{service.name}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/10 bg-[#222] text-white">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClick(service.id)}
                          className="bg-red-500 text-white hover:bg-red-600"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p
                className="cursor-pointer text-sm text-gray-400"
                onClick={() => handleCardClick(service)}
              >
                {service.description}
              </p>
            </div>
          ))}
          {services.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              Nenhum serviço cadastrado.
            </div>
          )}
        </div>

        {/* Mobile Edit Dialog */}
        {selectedService && (
          <UpsertServiceDialog
            defaultValues={{
              id: selectedService.id,
              name: selectedService.name,
              description: selectedService.description,
              imageUrl: selectedService.imageUrl,
              price: Number(selectedService.price),
            }}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            hideTrigger={true}
          />
        )}

        {/* Desktop View - Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#222] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">
                    {service.name}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3">
                    {service.description}
                  </td>
                  <td className="px-4 py-3">
                    {Number(service.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="flex justify-end gap-2 px-4 py-3 text-right">
                    <UpsertServiceDialog
                      defaultValues={{
                        id: service.id,
                        name: service.name,
                        description: service.description,
                        imageUrl: service.imageUrl,
                        price: Number(service.price),
                      }}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-white/10 bg-[#1A1A1A] text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Esta ação não pode ser desfeita. Isso excluirá
                            permanentemente o serviço &quot;{service.name}
                            &quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-white/10 bg-[#222] text-white">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClick(service.id)}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    Nenhum serviço cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ServicesTable
