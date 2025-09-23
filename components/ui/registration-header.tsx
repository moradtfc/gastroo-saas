import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface RegistrationHeaderProps {
  title: string
  description?: string
  backHref: string
  backLabel?: string
  icon?: LucideIcon
  className?: string
}

export function RegistrationHeader({
  title,
  description,
  backHref,
  backLabel = "Volver",
  icon: Icon,
  className,
}: RegistrationHeaderProps) {
  return (
    <div className={cn("space-y-24", className)}>
      {/* Back Navigation */}
      <div className="flex items-center">
        <Link href={backHref}>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-8 hover:bg-muted/50 transition-colors px-16 py-8"
          >
            <ArrowLeft className="h-16 w-16" />
            <span className="font-medium">{backLabel}</span>
          </Button>
        </Link>
      </div>

      {/* Header Content */}
      <div className="space-y-16">
        <div className="flex items-center gap-24">
          {Icon && (
            <div className="p-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <Icon className="h-32 w-32 text-primary" />
            </div>
          )}
          <div className="space-y-8">
            <h1
              className="font-semibold text-foreground leading-tight"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)", // Responsive from 28px to 40px
                fontWeight: 600,
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="text-muted-foreground font-medium leading-relaxed"
                style={{
                  fontSize: "clamp(0.875rem, 2vw, 1.125rem)", // Responsive from 14px to 18px
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
