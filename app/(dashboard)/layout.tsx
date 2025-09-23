"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg flex-shrink-0 border-r border-gray-200 relative z-10 hidden md:block">
        <Navigation />
      </div>

      {/* Mobile sidebar overlay - shows on mobile when needed */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        id="mobile-sidebar-overlay"
        style={{ display: "none" }}
      >
        <div className="w-64 bg-white shadow-lg h-full">
          <Navigation />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="md:hidden bg-white border-b border-gray-200 p-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Gastroo</h1>
          <button
            className="p-8 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => {
              const overlay = document.getElementById("mobile-sidebar-overlay")
              if (overlay) overlay.style.display = overlay.style.display === "none" ? "block" : "none"
            }}
          >
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {children}
      </div>
      <Toaster />
    </div>
  )
}
