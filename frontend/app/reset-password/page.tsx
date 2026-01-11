"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!token) {
      setMessage("Token de recuperación no válido o faltante.")
      setIsSuccess(false)
    }
  }, [token])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    // Validaciones
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setMessage(passwordError)
      setIsSuccess(false)
      setIsSubmitting(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Las contraseñas no coinciden")
      setIsSuccess(false)
      setIsSubmitting(false)
      return
    }

    if (!token) {
      setMessage("Token de recuperación no válido")
      setIsSuccess(false)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/service`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service: "auth.resetPassword",
          payload: {
            token: token,
            newPassword: formData.password
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage("Tu contraseña ha sido restablecida exitosamente. Serás redirigido al login.")
        setIsSuccess(true)
        setFormData({ password: "", confirmPassword: "" })
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setMessage(result.error || "Error al restablecer la contraseña")
        setIsSuccess(false)
      }
    } catch (err) {
      console.error("Error al restablecer contraseña:", err)
      setMessage("Error al conectarse con el servidor")
      setIsSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-green-500/20 z-10"></div>
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=800&width=600')`,
          }}
        >
          <div className="absolute inset-0 bg-black/30 z-20"></div>
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center text-white px-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4">Restablecer</h1>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-2">Contraseña</h2>
              <p className="text-base sm:text-lg lg:text-xl opacity-90">Sirius Cocina Ancestral</p>
              <div className="mt-4 lg:mt-8 w-24 sm:w-32 h-1 bg-gradient-to-r from-orange-400 to-green-400 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 mt-16 lg:mt-0">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-6 relative">
              <Image src="/images/logo zet.png" alt="Zet Logo" fill className="object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Nueva Contraseña</h2>
            <p className="text-sm sm:text-base text-gray-600">Ingresa tu nueva contraseña segura</p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              {/* New Password Field */}
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm sm:text-base">
                  Nueva Contraseña
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-sm sm:text-base"
                    placeholder="Ingresa tu nueva contraseña"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm sm:text-base">
                  Confirmar Contraseña
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-sm sm:text-base"
                    placeholder="Confirma tu nueva contraseña"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Requisitos de la contraseña:</p>
              <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
                <li>Mínimo 6 caracteres</li>
                <li>Se recomienda usar letras, números y símbolos</li>
              </ul>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 ${
                isSuccess 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {isSuccess ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="break-words">{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? "Restableciendo..." : "Restablecer Contraseña"}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <button 
              onClick={() => router.push("/login")}
              className="text-xs sm:text-sm text-orange-600 hover:text-orange-500 font-medium"
            >
              Volver al Login
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">© 2024 Sirius Cocina Ancestral - Todos los derechos reservados</p>
          </div>
        </div>
      </div>

      {/* Mobile Logo for small screens */}
      <div className="lg:hidden absolute top-4 sm:top-6 lg:top-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
          <Image src="/images/logo zet.png" alt="Zet Logo" fill className="object-contain" />
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
