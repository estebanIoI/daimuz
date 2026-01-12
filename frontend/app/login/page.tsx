"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import ClientOnly from "@/components/ClientOnly"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [isSubmittingReset, setIsSubmittingReset] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const [isMounted, setIsMounted] = useState(false) // Para controlar la hidratación
  const [showVideo, setShowVideo] = useState(false) // Para controlar la transición imagen -> video
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  // Controlar cuando el componente está montado en el cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Cambiar de imagen a video después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideo(true)
    }, 7000)
    return () => clearTimeout(timer)
  }, [])

  // Cargar datos guardados solo después de que el componente esté montado
  useEffect(() => {
    if (!isMounted) return
    
    try {
      const savedEmail = localStorage.getItem("rememberedEmail")
      const savedRememberMe = localStorage.getItem("rememberMe") === "true"
      
      if (savedEmail && savedRememberMe) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail,
          rememberMe: savedRememberMe
        }))
      }
    } catch (error) {
      console.warn("Error accessing localStorage:", error)
    }
  }, [isMounted])

  // Manejar cambio en el checkbox "Recordarme"
  const handleRememberMeChange = (checked: boolean) => {
    setFormData({ ...formData, rememberMe: checked })
    
    // Solo acceder a localStorage si estamos en el cliente
    if (typeof window !== 'undefined') {
      try {
        // Si se desmarca, limpiar datos guardados
        if (!checked) {
          localStorage.removeItem("rememberedEmail")
          localStorage.removeItem("rememberMe")
        }
      } catch (error) {
        console.warn("Error accessing localStorage:", error)
      }
    }
  }

  // Función para manejar recuperación de contraseña
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingReset(true)
    setResetMessage("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/service`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service: "auth.forgotPassword",
          payload: {
            email: forgotPasswordEmail
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setResetMessage("Se ha enviado un correo con las instrucciones para restablecer tu contraseña.")
        setForgotPasswordEmail("")
        setTimeout(() => {
          setShowForgotPassword(false)
          setResetMessage("")
        }, 3000)
      } else {
        setResetMessage(result.message || "Error al enviar el correo de recuperación")
      }
    } catch (err) {
      console.error("Error al enviar correo de recuperación:", err)
      setResetMessage("Error al conectarse con el servidor")
    } finally {
      setIsSubmittingReset(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/service`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service: "auth.login",
          payload: {
            email: formData.email,
            password: formData.password
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        alert("Credenciales incorrectas")
        return
      }

      const { token, user } = result.data

      // Guardar en localStorage (solo en el cliente)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("token", token)
          localStorage.setItem("userEmail", user.email)
          localStorage.setItem("userRole", user.role)
          localStorage.setItem("userId", user.id.toString())
          localStorage.setItem("userName", user.name || user.email.split('@')[0])

          // Manejar "Recordarme"
          if (formData.rememberMe) {
            localStorage.setItem("rememberedEmail", formData.email)
            localStorage.setItem("rememberMe", "true")
          } else {
            localStorage.removeItem("rememberedEmail")
            localStorage.removeItem("rememberMe")
          }
        } catch (error) {
          console.warn("Error accessing localStorage:", error)
        }
      }

      // Redireccionar según el rol
      switch (user.role) {
        case "administrador":
          window.location.href = "/dashboard"
          break
        case "mesero":
          window.location.href = "/mesero"
          break
        case "cajero":
          window.location.href = "/cajero"
          break
        case "cocinero":
          window.location.href = "/cocinero"
          break
        default:
          window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      alert("Error al conectarse con el servidor")
    }
  }


  return (
    <ClientOnly>
      <div className="min-h-screen relative" suppressHydrationWarning>
        {/* Full Background Container */}
        <div className="absolute inset-0 w-full h-full">
          {/* Imagen de fondo inicial */}
          <div 
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
            style={{
              backgroundImage: `url('/images/zet x1.jpg')`,
            }}
          />
          {/* Video de fondo */}
          {showVideo && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            >
              <source src="/vip/zet x.mp4" type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-green-500/20 z-10"></div>
          <div className="absolute inset-0 bg-black/30 z-20"></div>
        </div>

      {/* Main Content Container */}
      <div className="relative z-30 min-h-screen flex flex-col lg:flex-row items-center">
        {/* Left Side - Welcome Text */}
        <div className="w-full lg:w-1/2 text-center text-white p-4 sm:p-6 lg:p-8 lg:min-h-screen lg:flex lg:flex-col lg:justify-center">
          <div className="mt-16 lg:mt-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4"></h1>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-2"></h2>
            {/* Logo encima de "Sistema de gestión" */}
            <div className="relative w-48 sm:w-56 lg:w-64 h-48 sm:h-56 lg:h-64 mx-auto mb-4">
              <Image src="/images/logo zet.png" alt="Zet Logo" fill className="object-contain rounded-full" />
            </div>
            <p className="text-base sm:text-lg lg:text-xl opacity-90"></p>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex justify-center p-4 sm:p-6 lg:p-8 lg:min-h-screen lg:items-center">
          {/* Card Container - Bright Glass Effect */}
          <div className="w-full max-w-md backdrop-blur-md bg-white/15 rounded-2xl shadow-xl overflow-hidden border border-white/40 text-white ring-1 ring-white/30 ring-opacity-30">
            {/* Logo and Header */}
            <div className="text-center mt-4 mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-md mb-1">Sistema de Gestión</h2>
              <p className="text-sm sm:text-base text-white drop-shadow-sm">Accede a tu panel de administración</p>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8 pt-4">
              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Email/Usuario Field */}
                  <div>
                    <Label htmlFor="email" className="text-white font-medium text-sm sm:text-base">
                      Usuario o Email
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <Input
                        id="email"
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-8 sm:pl-10 h-10 sm:h-12 bg-white/10 border-white/40 text-white backdrop-blur-sm focus:border-orange-400 focus:ring-orange-300 placeholder-white/80 text-sm sm:text-base"
                        placeholder="Ingresa tu usuario o email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <Label htmlFor="password" className="text-white font-medium text-sm sm:text-base">
                      Contraseña
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-12 bg-white/10 border-white/40 text-white backdrop-blur-sm focus:border-orange-400 focus:ring-orange-300 placeholder-white/80 text-sm sm:text-base"
                        placeholder="Ingresa tu contraseña"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-white hover:text-white/80" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white hover:text-white/80" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleRememberMeChange(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-xs sm:text-sm text-white">
                      Recordarme
                    </Label>
                  </div>
                  <button 
                    type="button" 
                    className="text-xs sm:text-sm text-orange-300 hover:text-orange-200 font-medium"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-12 bg-black hover:bg-gray-800 text-white font-semibold text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/30"
                >
                  Acceder
                </Button>
              </form>

              {/* Border con gradiente brillante */}
              <div className="w-full h-1 bg-gradient-to-r from-orange-300 to-green-300 mt-4 sm:mt-6 shadow-md"></div>
              
              {/* Additional Links - Inside Card */}
              <div className="text-center space-y-2 mt-3 sm:mt-4 pb-2">
                <p className="text-xs sm:text-sm text-white drop-shadow-sm">
                  ¿Problemas para ingresar?{" "}
                  <button className="text-orange-200 hover:text-orange-100 font-medium">Contacta soporte</button>
                </p>
                <div className="pt-2 sm:pt-3 border-t border-white/30 mt-2">
                  <p className="text-xs text-white/90">© 2024 DAIMUZ - Todos los derechos reservados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Recuperar Contraseña</h3>
              <p className="text-sm sm:text-base text-gray-600">Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="forgotEmail" className="text-gray-700 font-medium text-sm sm:text-base">
                  Correo Electrónico
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <Input
                    id="forgotEmail"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-8 sm:pl-10 h-10 sm:h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-sm sm:text-base"
                    placeholder="ejemplo@correo.com"
                    required
                    disabled={isSubmittingReset}
                  />
                </div>
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-md text-xs sm:text-sm ${
                  resetMessage.includes("enviado") 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {resetMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail("")
                    setResetMessage("")
                  }}
                  disabled={isSubmittingReset}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:flex-1 h-10 sm:h-11 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-sm sm:text-base"
                  disabled={isSubmittingReset}
                >
                  {isSubmittingReset ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </ClientOnly>
  )
}
