"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChefHat, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    id: 1,
    title: "¡Bienvenido a Gastroo!",
    description: "Te guiaremos para configurar tu cuenta en 3 sencillos pasos",
    content: (
      <div className="text-center py-8">
        <ChefHat className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">¡Perfecto! Tu cuenta está lista</h3>
        <p className="text-muted-foreground">
          Ahora vamos a configurar tu restaurante para que puedas comenzar a gestionar tus costos de manera profesional.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Crea tu primer ingrediente",
    description: "Añade ingredientes básicos que uses frecuentemente",
    content: (
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <h4 className="font-medium mb-2">Ejemplo: Tomate</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Precio:</span>
              <span className="ml-2">€2.50/kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">Proveedor:</span>
              <span className="ml-2">Mercado Central</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Los ingredientes son la base de tus escandallos. Puedes añadir más después.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    title: "Crea tu primer escandallo",
    description: "Diseña una receta con costos calculados automáticamente",
    content: (
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <h4 className="font-medium mb-2">Ejemplo: Ensalada Mediterránea</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tomate (200g)</span>
              <span>€0.50</span>
            </div>
            <div className="flex justify-between">
              <span>Aceite de oliva (20ml)</span>
              <span>€0.30</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Costo total:</span>
              <span className="text-primary">€0.80</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Los escandallos te ayudan a calcular el costo real de cada plato.
        </p>
      </div>
    ),
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    // Redirect to dashboard
    window.location.href = "/dashboard"
  }

  const currentStepData = steps.find((step) => step.id === currentStep)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Gastroo</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">
              Paso {currentStep} de {steps.length}
            </span>
          </div>
          <Progress value={progress} className="w-full max-w-md mx-auto" />
        </div>

        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStepData?.content}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentStep === steps.length ? (
                <Button onClick={handleFinish} className="bg-accent hover:bg-accent/90 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Comenzar a usar Gastroo
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {currentStep === 1 && (
              <div className="mt-6 text-center">
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
                  Saltar configuración inicial
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
