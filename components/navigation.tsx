"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  MenuSquare,
  BarChart3,
  Settings,
  LogOut,
  DollarSign,
  Receipt,
  Building,
  Package,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventario", href: "/articles", icon: ShoppingCart },
  { name: "Proveedores", href: "/suppliers", icon: Building },
  { name: "Compras", href: "/purchases", icon: Package },
  { name: "Recetas", href: "/recipes", icon: ChefHat },
  { name: "Menús", href: "/menus", icon: MenuSquare },
  { name: "Ventas", href: "/sales", icon: DollarSign },
  { name: "Gastos", href: "/expenses", icon: Receipt },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Configuración", href: "/settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  console.log("[v0] Navigation component rendering, current pathname:", pathname)

  return (
    <nav className="flex flex-col h-full bg-card border-r border-border shadow-lg min-w-[240px] w-64 relative z-20">
      <div className="p-6 border-b border-border bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground tracking-tight font-sans">Gastroo</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">Restaurant Management</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg border border-primary/20 scale-[1.02]"
                      : "text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/8 hover:to-accent/5 border border-transparent hover:border-primary/20 hover:shadow-md hover:scale-[1.01]",
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur-sm" />
                  )}
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300 relative z-10",
                      isActive
                        ? "text-primary-foreground drop-shadow-sm"
                        : "text-muted-foreground group-hover:text-primary group-hover:scale-110",
                    )}
                  />
                  <span className="font-medium relative z-10">{item.name}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-accent rounded-full shadow-sm relative z-10" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-border bg-gradient-to-r from-muted/30 to-muted/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-300 font-medium rounded-xl group"
          onClick={() => {
            localStorage.removeItem("gastroo_user")
            window.location.href = "/login"
          }}
        >
          <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
          Cerrar Sesión
        </Button>
      </div>
    </nav>
  )
}
