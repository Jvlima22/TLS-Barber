"use client"

import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { CalendarIcon, MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Notifications from "./notifications"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const Header = () => {
  const { data } = useSession()
  const router = useRouter()

  const handleBookingsClick = () => {
    if (!data?.user) {
      return toast.error(
        "Você precisa estar logado para ver seus agendamentos.",
      )
    }
    router.push("/bookings")
  }

  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between bg-[#1D1D1D] p-5">
        {/* Logo */}
        <Link href="/">
          <Image
            alt="TLS Barber"
            src="/Logo.svg"
            height={18}
            width={180}
            className="lg:ml-[250px]"
          />
        </Link>

        {/* Botões e Menu */}
        <div className="flex items-center lg:mr-[250px]">
          <Notifications />

          {/* Desktop specific */}
          <div className="hidden items-center lg:flex">
            <Button
              variant="default"
              className="mr-2 flex justify-start gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
              onClick={handleBookingsClick}
            >
              <CalendarIcon className="h-4 w-4 text-white" />
              <span className="text-white">Agendamentos</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="mr-2 flex justify-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
                >
                  <MenuIcon color="#ffffff" />
                </Button>
              </SheetTrigger>
              <SidebarSheet />
            </Sheet>
          </div>

          {/* Mobile specific */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="mr-2 flex justify-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
                >
                  <MenuIcon color="#ffffff" />
                </Button>
              </SheetTrigger>
              <SidebarSheet />
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Header
