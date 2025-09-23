import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Gastroo - Restaurant Management Platform",
  description: "Professional cost management, recipes, and ingredients for restaurants and chefs",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handle unhandled promise rejections from external scripts (like MetaMask extensions)
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && typeof event.reason === 'string' && 
                    (event.reason.includes('MetaMask') || event.reason.includes('Failed to connect'))) {
                  console.warn('External MetaMask connection attempt blocked - not needed for this application');
                  event.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable} ${poppins.variable} antialiased`}>
        <Suspense fallback={null}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
