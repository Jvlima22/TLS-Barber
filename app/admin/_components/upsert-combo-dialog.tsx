"use client"

import { Button } from "@/app/_components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select"
import { Input } from "@/app/_components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ComboSchema, comboSchema } from "../_schemas"
import { upsertCombo } from "@/app/_actions/upsert-combo"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { Service } from "@prisma/client"
import ImageUpload from "./image-upload"

interface UpsertComboDialogProps {
  defaultValues?: ComboSchema
  services: Service[]
  isOpen?: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange?: (isOpen: boolean) => void
  hideTrigger?: boolean
  disabled?: boolean
  disabledMessage?: string
}

const UpsertComboDialog = ({
  defaultValues,
  services,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger,
  disabled,
  disabledMessage,
}: UpsertComboDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  const form = useForm<ComboSchema>({
    resolver: zodResolver(comboSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      imageUrl: "",
      price: 0,
      service1Id: "",
      service2Id: "",
    },
  })

  const onSubmit = async (data: ComboSchema) => {
    try {
      await upsertCombo(data)
      toast.success("Combo salvo com sucesso!")
      setIsOpen(false)
      form.reset()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar combo.")
    }
  }

  const isFormValid = !!(
    form.watch("name") &&
    form.watch("description") &&
    form.watch("imageUrl") &&
    form.watch("service1Id") &&
    form.watch("service2Id")
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant={defaultValues ? "ghost" : "default"}
            disabled={disabled && !defaultValues}
            className="h-8 w-full px-3 text-xs lg:h-10 lg:px-4 lg:text-sm"
          >
            {defaultValues ? (
              "Editar"
            ) : (
              <div className="flex items-center gap-2">
                {disabled && <span className="text-xs">🔒</span>}
                {disabled ? disabledMessage : "Adicionar combo"}
              </div>
            )}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100%-1rem)] border-white/10 bg-[#1A1A1A] p-3 text-white lg:w-full lg:max-w-lg lg:p-6">
        <DialogHeader className="space-y-0.5 lg:space-y-2">
          <DialogTitle className="text-[clamp(0.95rem,4vw,1.125rem)] lg:text-xl">
            {defaultValues ? "Editar" : "Adicionar"} combo
          </DialogTitle>
          <DialogDescription className="text-[10px] text-gray-400 lg:text-sm">
            Crie uma recomendação combinando dois serviços.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2 lg:space-y-4"
          >
            <div className="grid grid-cols-2 gap-2 lg:gap-4">
              <FormField
                control={form.control}
                name="service1Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] lg:text-sm">
                      Serviço 1
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 border-white/10 bg-[#222] text-sm text-white lg:h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-white/10 bg-[#222] text-white">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service2Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] lg:text-sm">
                      Serviço 2
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 border-white/10 bg-[#222] text-sm text-white lg:h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-white/10 bg-[#222] text-white">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">
                    Nome do Combo
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Combo Barba + Cabelo"
                      {...field}
                      className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">
                    Descrição
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: O melhor trato para seu visual..."
                      {...field}
                      className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">
                    Preço Promocional (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Vazio para somar os serviços"
                      {...field}
                      className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                    />
                  </FormControl>
                  <p className="text-[9px] italic text-gray-500 lg:text-[10px]">
                    Deixe vazio para usar a soma dos serviços selecionados.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">
                    Imagem do Combo
                  </FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-row gap-2 lg:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="h-9 flex-1 border-white/10 text-white lg:h-10 lg:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={`h-9 flex-1 transition-all duration-300 lg:h-10 lg:flex-none ${isFormValid ? "bg-[#3EABFD] text-white hover:bg-[#2e8acb]" : "bg-primary text-black"}`}
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default UpsertComboDialog
