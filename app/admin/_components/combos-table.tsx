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
import { deleteCombo } from "@/app/_actions/delete-combo"
import { toast } from "sonner"
import { useState } from "react"
import UpsertComboDialog from "./upsert-combo-dialog"
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

interface CombosTableProps {
  combos: (any & { service1: Service; service2: Service })[]
  services: Service[]
  subscriptionPlan: string
}

const CombosTable = ({
  combos,
  services,
  subscriptionPlan,
}: CombosTableProps) => {
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const limits = getPlanLimits(subscriptionPlan as any)
  const isLimitReached = combos.length >= limits.maxCombos

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteCombo(id)
      toast.success("Combo excluído com sucesso!")
    } catch (error) {
      toast.error("Erro ao excluir combo.")
    }
  }

  const handleCardClick = (combo: any) => {
    setSelectedCombo(combo)
    setIsDialogOpen(true)
  }

  return (
    <Card className="border-white/10 bg-[#1A1A1A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[clamp(1rem,4vw,1.25rem)] text-white lg:text-xl">
          Gerenciar combos
        </CardTitle>
        <div className="w-fit">
          <UpsertComboDialog
            services={services}
            disabled={isLimitReached}
            disabledMessage={`Limite de ${limits.maxCombos} atingido`}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Cards */}
        <div className="flex flex-col gap-4 lg:hidden">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#222] p-4"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex flex-1 cursor-pointer flex-col gap-1"
                  onClick={() => handleCardClick(combo)}
                >
                  <h3 className="font-bold text-white">{combo.name}</h3>
                  <span className="text-sm font-semibold text-[#3EABFD]">
                    {Number(combo.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <span className="text-xs text-gray-500">
                    {combo.service1.name} + {combo.service2.name}
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
                          permanentemente o combo &quot;{combo.name}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/10 bg-[#222] text-white">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClick(combo.id)}
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
                className="line-clamp-1 cursor-pointer text-sm text-gray-400"
                onClick={() => handleCardClick(combo)}
              >
                {combo.description}
              </p>
            </div>
          ))}
          {combos.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              Nenhum combo cadastrado.
            </div>
          )}
        </div>

        {/* Mobile Edit Dialog */}
        {selectedCombo && (
          <UpsertComboDialog
            services={services}
            defaultValues={{
              id: selectedCombo.id,
              name: selectedCombo.name,
              description: selectedCombo.description,
              imageUrl: selectedCombo.imageUrl,
              price: Number(selectedCombo.price),
              service1Id: selectedCombo.service1Id,
              service2Id: selectedCombo.service2Id,
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
                <th className="px-4 py-3">Serviços</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {combos.map((combo) => (
                <tr key={combo.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">
                    {combo.name}
                  </td>
                  <td
                    className="max-w-xs truncate px-4 py-3 text-gray-400"
                    title={combo.description}
                  >
                    {combo.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className="max-w-xs truncate px-4 py-3">
                      {combo.service1.name} + {combo.service2.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {Number(combo.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="flex justify-end gap-2 px-4 py-3 text-right">
                    <UpsertComboDialog
                      services={services}
                      defaultValues={{
                        id: combo.id,
                        name: combo.name,
                        description: combo.description,
                        imageUrl: combo.imageUrl,
                        price: Number(combo.price),
                        service1Id: combo.service1Id,
                        service2Id: combo.service2Id,
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
                            permanentemente o combo &quot;{combo.name}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-white/10 bg-[#222] text-white">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClick(combo.id)}
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
              {combos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    Nenhum combo cadastrado.
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

export default CombosTable
