"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select"
import { upsertBankCredential } from "@/app/_actions/upsert-bank-credential"
import { toast } from "sonner"
import {
  CheckCircle2Icon,
  LayoutGridIcon,
  ListIcon,
  InfoIcon,
  RefreshCcwIcon,
  UnlinkIcon,
} from "lucide-react"
import Image from "next/image"
import { deleteBankCredential } from "@/app/_actions/delete-bank-credential"
import { toggleBankCredentialStatus } from "@/app/_actions/toggle-bank-credential"

const getBankHelpInstructions = (provider: string) => {
  switch (provider) {
    case "ITAU":
      return {
        steps: [
          <>
            Acesse o portal Itaú for Developers (
            <a
              href="https://devportal.itau.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              devportal.itau.com.br
            </a>
            ) e faça seu login.
          </>,
          "No menu vertical à esquerda, vá em 'Minhas Aplicações' e clique em 'Criar nova'.",
          "Escolha o produto 'Pix' (ou 'Recebimentos e Pix') e clique em continuar.",
          "Informe um nome para sua aplicação e gere as credenciais (Client ID e Secret).",
          "Copie e cole abaixo as chaves geradas para ativar o ambiente de Sandbox (Testes) ou Produção.",
        ],
        link: "https://devportal.itau.com.br/",
      }
    case "BRADESCO":
      return {
        steps: [
          <>
            Acesse o portal Bradesco Developers (
            <a
              href="https://api.bradesco"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              api.bradesco
            </a>
            ).
          </>,
          "Selecione a API Pix ou Boleto no Catálogo de APIs.",
          "Siga o fluxo de geração de chaves e certificados de produção.",
          "Faça o upload/cole o arquivo .pem gerado aqui para efetivar as cobranças.",
        ],
        link: "https://api.bradesco/",
      }
    case "MERCADO_PAGO":
      return {
        steps: [
          <>
            Acesse:{" "}
            <a
              href="https://www.mercadopago.com.br/developers"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              mercadopago.com.br/developers
            </a>{" "}
            e faça login. No menu superior, clique em &apos;Suas
            integrações&apos;.
          </>,
          "Clique no botão azul &apos;Criar aplicação&apos;.",
          "Siga os 4 passos: Dê um &apos;Nome&apos;, escolha &apos;Pagamentos online&apos; > &apos;Com desenvolvimento próprio&apos; > &apos;Checkout Pro&apos;, e confirme a criação.",
          "Na sua nova aplicação, acesse o menu lateral esquerdo &apos;PRODUÇÃO &gt; Credenciais de produção&apos;.",
          <>
            Preencha o &apos;Setor&apos; (Ex: Beleza, estética e saúde), e na
            &apos;URL do site&apos; OBRIGATORIAMENTE coloque:{" "}
            <a
              href="https://gb-barbearia.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-500 hover:underline"
            >
              https://gb-barbearia.vercel.app/
            </a>{" "}
            (se for diferente não irá funcionar).
          </>,
          "Clique no botão azul &apos;Ativar credenciais de produção&apos;.",
          "Pronto! Agora copie apenas o seu &apos;Access Token&apos; (começa com APP_USR...) clicando no pequeno ícone de cópia ao lado dele e cole a chave no campo abaixo.",
        ],
        alert:
          "⚠️ ATENÇÃO PIX: O QR Code só será gerado se a sua conta do Mercado Pago possuir uma chave PIX cadastrada e ativa.",
        link: "https://www.mercadopago.com.br/developers/panel/applications",
      }
    case "PICPAY":
      return {
        steps: [
          <>
            Acesse o Painel Lojista do PicPay (
            <a
              href="https://painel-lojista.picpay.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              painel-lojista.picpay.com
            </a>
            ).
          </>,
          "Vá no menu Configurações > Integrações e APIs.",
          "Encontre a opção de Gerar Tokens (x-seller-token).",
          "Copie a chave ativa e cole aqui para habilitar sua carteira.",
        ],
        link: "https://studio.picpay.com/",
      }
    case "CUSTOM":
      return {
        steps: [
          "Acesse o painel de desenvolvedor do seu Gateway de Pagamento (ex: Asaas, Pagar.me, Vindi).",
          "Procure pelo serviço chamado &apos;Webhooks&apos; ou &apos;Notificações de Pagamentos&apos;.",
          "Adicione a URL do seu sistema na plataforma para os avisos acontecerem de forma automática.",
        ],
        link: "",
      }
    default:
      return { steps: [] as React.ReactNode[], link: "" }
  }
}

interface IntegrationsManagerProps {
  banks: any[]
}

const getBankLogo = (provider: string, imageUrl: string) => {
  if (provider === "ITAU")
    return "https://logodownload.org/wp-content/uploads/2014/05/itau-logo-2.png"
  if (provider === "BRADESCO")
    return "https://logodownload.org/wp-content/uploads/2018/09/bradesco-logo-4.png"
  if (provider === "MERCADO_PAGO")
    return "https://cdn.shopify.com/app-store/listing_images/4f3dc60a0ef8beee2a168713fe20181f/icon/CIHzwOjZsI0DEAE=.png"
  if (provider === "PICPAY")
    return "https://www.pngall.com/wp-content/uploads/13/PayPal-Logo-PNG.png"
  return imageUrl
}

const IntegrationsManager = ({ banks }: IntegrationsManagerProps) => {
  const router = useRouter()
  const [selectedBank, setSelectedBank] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [environment, setEnvironment] = useState<"SANDBOX" | "PRODUCTION">(
    "PRODUCTION",
  )

  const handleOpenBank = (bank: any) => {
    setSelectedBank(bank)
    setClientId("")
    setClientSecret("")
    setPublicKey("")
    const creds = Array.isArray(bank.credentials)
      ? bank.credentials[0]
      : bank.credentials
    setEnvironment(creds?.environment || "PRODUCTION")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Para MP, apenas o secret (Access Token) é obrigatório.
    if (selectedBank?.provider === "MERCADO_PAGO") {
      if (!clientSecret) {
        toast.error("Obrigatório informar o Access Token (APP_USR-...)")
        return
      }
    } else {
      if (!clientSecret) {
        toast.error("Preencha o campo de credencial obrigatório")
        return
      }
    }

    // Limpeza rigorosa para evitar o erro de ByteString (caracteres não-ASCII como o ✔)
    const clean = (s: string) => s.replace(/[^\x00-\x7F]/g, "").trim()
    const cleanClientId = clean(clientId)
    const cleanClientSecret = clean(clientSecret)
    const cleanPublicKey = clean(publicKey)

    try {
      setIsLoading(true)
      await upsertBankCredential({
        bankId: selectedBank.id,
        clientId: cleanClientId,
        clientSecret: cleanClientSecret,
        publicKey: cleanPublicKey,
        environment,
      })
      toast.success("Conectado com sucesso!")
      setIsDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar as credenciais")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (bank: any) => {
    const creds = Array.isArray(bank.credentials)
      ? bank.credentials[0]
      : bank.credentials
    try {
      const currentStatus = creds?.isEnabled
      setIsLoading(true)
      await toggleBankCredentialStatus(bank.id, !currentStatus)
      toast.success(
        !currentStatus ? "Integração ativada!" : "Integração desativada!",
      )
      router.refresh()
    } catch (error) {
      toast.error("Erro ao alterar status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async (bank: any) => {
    if (
      !confirm("Tem certeza que deseja desconectar e excluir as credenciais?")
    )
      return

    try {
      setIsLoading(true)
      await deleteBankCredential(bank.id)
      toast.success("Banco desconectado!")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao desconectar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-0">
        <div>
          <h2 className="text-lg font-bold text-white lg:text-xl">
            Integrações Bancárias
          </h2>
          <p className="text-xs text-gray-400 lg:text-sm">
            Conecte suas contas para receber pagamentos diretamente.
          </p>
        </div>

        <div className="flex w-fit self-end rounded-lg border border-white/10 bg-[#1A1A1A] p-1 lg:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-2 transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
          >
            <LayoutGridIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-3"
        }
      >
        {banks.map((bank) => {
          const credentials = Array.isArray(bank.credentials)
            ? bank.credentials[0]
            : bank.credentials
          const hasCredentials = !!credentials

          if (viewMode === "list") {
            return (
              <div
                key={bank.id}
                className="flex flex-row items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] p-3 transition-colors hover:border-primary/50 lg:p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg lg:h-10 lg:w-10">
                    <Image
                      src={getBankLogo(bank.provider, bank.imageUrl)}
                      alt={bank.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <h3 className="truncate text-xs font-bold text-white lg:text-base">
                        {bank.name}
                      </h3>
                      {hasCredentials && (
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                    {hasCredentials && (
                      <p className="truncate text-[9px] text-gray-400 lg:text-sm">
                        Conectado em {credentials?.environment}
                      </p>
                    )}
                  </div>
                </div>
                {bank.isActive ? (
                  hasCredentials ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDisconnect(bank)}
                        disabled={isLoading}
                      >
                        <UnlinkIcon className="h-4 w-4" />
                      </Button>
                      <div
                        className={`relative h-5 w-10 cursor-pointer rounded-full transition-colors ${credentials?.isEnabled ? "bg-green-500" : "bg-gray-600"}`}
                        onClick={() => handleToggle(bank)}
                      >
                        <div
                          className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${credentials?.isEnabled ? "right-1" : "left-1"}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenBank(bank)}
                      disabled={isLoading}
                    >
                      Conectar
                    </Button>
                  )
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Em Breve
                  </Button>
                )}
              </div>
            )
          }

          return (
            <div
              key={bank.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#1A1A1A] p-4 transition-colors hover:border-primary/50 lg:gap-4 lg:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-lg lg:h-10 lg:w-10">
                    <Image
                      src={getBankLogo(bank.provider, bank.imageUrl)}
                      alt={bank.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-white lg:text-base">
                    {bank.name}
                  </h3>
                </div>
                {hasCredentials && (
                  <CheckCircle2Icon className="h-4 w-4 text-green-500 lg:h-6 lg:w-6" />
                )}
              </div>
              <p className="min-h-[20px] text-xs text-gray-400 lg:min-h-[40px] lg:text-sm">
                {hasCredentials ? `Ambiente: ${credentials?.environment}` : ""}
              </p>
              {bank.isActive ? (
                hasCredentials ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(bank)}
                        disabled={isLoading}
                      >
                        <UnlinkIcon className="mr-2 h-4 w-4" />
                        Desconectar
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {credentials?.isEnabled ? "Ativo" : "Off"}
                        </span>
                        <div
                          className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${credentials?.isEnabled ? "bg-green-500" : "bg-gray-600"}`}
                          onClick={() => handleToggle(bank)}
                        >
                          <div
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${credentials?.isEnabled ? "right-1" : "left-1"}`}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenBank(bank)}
                      disabled={isLoading}
                    >
                      <RefreshCcwIcon className="mr-2 h-3 w-3" />
                      Atualizar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenBank(bank)}
                    disabled={isLoading}
                  >
                    Conectar
                  </Button>
                )
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Em Breve
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-white/10 bg-[#1A1A1A] sm:max-w-[450px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">
                Conectar {selectedBank?.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsHelpDialogOpen(true)}
              >
                <InfoIcon className="h-5 w-5" />
              </Button>
            </div>
            <DialogDescription className="text-gray-400">
              Selecione o ambiente e insira as credenciais obtidas no painel de
              desenvolvedor.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Ambiente</label>
              <Select
                value={environment}
                onValueChange={(v: any) => setEnvironment(v)}
              >
                <SelectTrigger className="border-white/10 bg-[#222]">
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1A1A1A]">
                  <SelectItem value="SANDBOX">Sandbox (Testes)</SelectItem>
                  <SelectItem value="PRODUCTION">Produção (Real)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {selectedBank?.provider !== "MERCADO_PAGO" &&
                selectedBank?.provider !== "ITAU" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white">
                      Client ID
                    </label>
                    <Input
                      placeholder="Insira o Client ID"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="border-white/10 bg-[#222]"
                    />
                  </div>
                )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">
                  {selectedBank?.provider === "MERCADO_PAGO"
                    ? "Access Token"
                    : selectedBank?.provider === "ITAU"
                      ? "Itaú Client Secret"
                      : "Client Secret"}
                </label>
                <Input
                  placeholder={
                    selectedBank?.provider === "MERCADO_PAGO"
                      ? "Copie o Access Token e cole aqui"
                      : selectedBank?.provider === "ITAU"
                        ? "Insira o Client Secret do Itaú"
                        : "Insira o Client Secret"
                  }
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="border-white/10 bg-[#222]"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="border-white/10 bg-[#1A1A1A] sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Como configurar {selectedBank?.name}?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Siga os passos abaixo para obter suas credenciais.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 flex flex-col gap-3 rounded-md border border-primary/20 bg-primary/10 p-5 text-sm text-gray-300">
            <ul className="list-inside list-decimal space-y-4">
              {selectedBank &&
                getBankHelpInstructions(selectedBank.provider).steps.map(
                  (step, i) => <li key={i}>{step}</li>,
                )}
            </ul>
          </div>
          {selectedBank &&
            getBankHelpInstructions(selectedBank.provider).alert && (
              <div className="mt-2 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-500">
                {getBankHelpInstructions(selectedBank.provider).alert}
              </div>
            )}
          <div className="mt-2 flex justify-end">
            <Button onClick={() => setIsHelpDialogOpen(false)}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default IntegrationsManager
