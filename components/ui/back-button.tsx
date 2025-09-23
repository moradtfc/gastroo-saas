import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BackButtonProps {
  href: string
  label?: string
  className?: string
}

export function BackButton({ href, label = "Volver", className = "" }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`flex items-center gap-2 px-2 text-muted-foreground hover:text-foreground transition-colors ${className}`}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    </Link>
  )
}
