"use client"

import { useState, useEffect } from "react"

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock authentication check - in a real app this would check tokens, cookies, etc.
    const checkAuthStatus = () => {
      // For demo purposes, we'll assume user is not authenticated by default
      // In a real implementation, this would check localStorage, cookies, or make an API call
      const authToken = localStorage.getItem("authToken")
      setIsAuthenticated(!!authToken)
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const login = (token: string) => {
    localStorage.setItem("authToken", token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
