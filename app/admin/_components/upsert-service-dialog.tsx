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
import { Input } from "@/app/_components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ServiceSchema, serviceSchema } from "../_schemas"
import { upsertService } from "@/app/_actions/upsert-service"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import ImageUpload from "./image-upload"

interface UpsertServiceDialogProps {
  defaultValues?: ServiceSchema
  isOpen?: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange?: (isOpen: boolean) => void
  hideTrigger?: boolean
  disabled?: boolean
  disabledMessage?: string
}

const UpsertServiceDialog = ({
  defaultValues,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger,
  disabled,
  disabledMessage,
}: UpsertServiceDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  const form = useForm<ServiceSchema>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      imageUrl: "",
      price: 0,
    },
  })

  const onSubmit = async (data: ServiceSchema) => {
    try {
      await upsertService({
        ...data,
      })
      toast.success("Serviço salvo com sucesso!")
      setIsOpen(false)
      form.reset()
    } catch (error) {
      toast.error("Erro ao salvar serviço.")
    }
  }

  const isFormValid = !!(
    form.watch("name") &&
    form.watch("description") &&
    form.watch("imageUrl") &&
    form.watch("price") > 0
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
                {disabled ? disabledMessage : "Adicionar serviço"}
              </div>
            )}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100%-1rem)] border-white/10 bg-[#1A1A1A] p-3 text-white lg:w-full lg:p-6">
        <DialogHeader className="space-y-0.5 lg:space-y-2">
          <DialogTitle className="text-[clamp(0.95rem,4vw,1.125rem)] lg:text-xl">
            {defaultValues ? "Editar" : "Adicionar"} serviço
          </DialogTitle>
          <DialogDescription className="text-[10px] text-gray-400 lg:text-sm">
            Preencha os dados abaixo para {defaultValues ? "editar" : "criar"} o
            serviço.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2 lg:space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Corte de Cabelo"
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
                      placeholder="Ex: Corte social completo..."
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
                    Preço (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 50.00"
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">
                    Imagem
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

export default UpsertServiceDialog
