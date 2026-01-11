"use client"

import { useState, useEffect } from "react"

export function useAuth(requiredRole?: string) {
  const [currentUser, setCurrentUser] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    const userEmail = localStorage.getItem("userEmail")

    if (!role) {
      window.location.href = "/login"
      return
    }

    // Si se especifica un rol requerido, verificarlo
    if (requiredRole && role !== requiredRole) {
      window.location.href = "/login"
      return
    }

    setCurrentUser(userEmail || "Usuario")
    setUserRole(role)
    setIsAuthenticated(true)
  }, [requiredRole])

  const handleLogout = (): void => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return {
    currentUser,
    userRole,
    isAuthenticated,
    handleLogout,
  }
}
