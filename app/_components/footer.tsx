"use client"

import Link from "next/link"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { usePathname } from "next/navigation"

const Footer = () => {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <footer>
      <Card>
        <CardContent className="px-5 py-6">
          <div className="flex flex-col items-center justify-center gap-2 lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:justify-center lg:gap-2">
            <p className="text-[clamp(10px,3.5vw,14px)] text-gray-400 lg:text-sm">
              © 2025 Copyright <span className="font-bold">TGL Barber.</span>
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[clamp(10px,3.5vw,14px)] text-gray-400 lg:text-sm">
                Desenvolvido por
              </span>
              <Link
                href="https://www.tglsolutions.com.br"
                target="_blank"
                className="ml-1"
              >
                <Image
                  alt="TGL Solutions"
                  src="/logo-tgl.svg"
                  height={18}
                  width={120}
                  className="w-[clamp(80px,25vw,120px)] lg:w-[120px]"
                />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </footer>
  )
}

export default Footer
