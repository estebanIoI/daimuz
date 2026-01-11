"use client"

import { UserPlus, Edit, Eye, EyeOff, Key, Shield, Users, CreditCard, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatsCard } from "@/components/common/StatsCard"
import { UserModal } from "@/components/dashboard/modals/UserModal"
import { ResetPasswordModal } from "@/components/dashboard/modals/ResetPasswordModal"
import { useState } from "react"
import { useApi } from "@/hooks/useApi"
import type { User } from "@/types"

interface UserManagementProps {
  users: User[]
  setUsers: (users: User[]) => void
  onRefreshUsers?: () => Promise<void>
}

export function UserManagement({ users, setUsers, onRefreshUsers }: UserManagementProps) {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const { apiCall } = useApi()

  const toggleUserStatus = async (id: number) => {
    try {
      const user = users.find(u => u.id === id)
      if (!user) return

      const updatedUser = await apiCall("user.toggleUserStatus", { 
        id: id, 
        active: !user.active 
      })
      
      setUsers(users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)))
      
      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
    } catch (error: any) {
      alert("Error al cambiar estado del usuario: " + error.message)
    }
  }

  const handleAddUser = async (formData: any) => {
    try {
      const newUser = await apiCall("user.create", formData)
      setUsers([...users, newUser])
      
      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
    } catch (error: any) {
      alert("Error al crear usuario: " + error.message)
    }
  }

  const handleEditUser = async (formData: any) => {
    try {
      if (!editingUser) return
      
      const updatedUser = await apiCall("user.update", { 
        id: editingUser.id, 
        ...formData 
      })
      
      setUsers(users.map((u) => (u.id === editingUser.id ? updatedUser : u)))
      setEditingUser(null)
      
      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
    } catch (error: any) {
      alert("Error al actualizar usuario: " + error.message)
    }
  }

  const handleResetPassword = async (newPassword: string) => {
    try {
      if (!resetPasswordUser) return
      
      await apiCall("user.resetPassword", { 
        id: resetPasswordUser.id, 
        new_password: newPassword 
      })
      
      alert(`Contraseña restablecida exitosamente para ${resetPasswordUser.name}`)
      setIsResetPasswordModalOpen(false)
      setResetPasswordUser(null)
    } catch (error: any) {
      alert("Error al restablecer contraseña: " + error.message)
    }
  }

  const openResetPasswordModal = (user: User) => {
    setResetPasswordUser(user)
    setIsResetPasswordModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setIsUserModalOpen(true)
  }

  const openAddModal = () => {
    setEditingUser(null)
    setIsUserModalOpen(true)
  }

  const closeModal = () => {
    setIsUserModalOpen(false)
    setEditingUser(null)
  }

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false)
    setResetPasswordUser(null)
  }

  const handleSave = (formData: any) => {
    if (editingUser) {
      handleEditUser(formData)
    } else {
      handleAddUser(formData)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">👥 Usuarios</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Administra roles y permisos</p>
        </div>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-4"
          onClick={openAddModal}
        >
          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Usuario</span>
          <span className="sm:hidden ml-1">Agregar</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-4 mb-3 sm:mb-6">
        <StatsCard
          title="Admins"
          value={users.filter((u) => u.role === "administrador").length}
          icon={Shield}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
        />
        <StatsCard
          title="Meseros"
          value={users.filter((u) => u.role === "mesero").length}
          icon={Users}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          borderColor="border-green-200"
        />
        <StatsCard
          title="Cajeros"
          value={users.filter((u) => u.role === "cajero").length}
          icon={CreditCard}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
        />
        <StatsCard
          title="Cocineros"
          value={users.filter((u) => u.role === "cocinero").length}
          icon={Utensils}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
        />
      </div>

      <Card>
        <CardContent className="p-2 sm:p-6">
          {/* Vista de tabla para pantallas grandes */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "administrador"
                            ? "default"
                            : user.role === "mesero"
                              ? "secondary"
                              : user.role === "cajero"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{user.lastLogin || "Nunca"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openEditModal(user)}
                          title="Editar usuario"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => toggleUserStatus(user.id)}
                          title={user.active ? "Desactivar usuario" : "Activar usuario"}
                        >
                          {user.active ? (
                            <EyeOff className="w-4 h-4 text-red-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openResetPasswordModal(user)}
                          title="Restablecer contraseña"
                        >
                          <Key className="w-4 h-4 text-blue-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="lg:hidden space-y-2">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">{user.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <Badge
                        variant={
                          user.role === "administrador"
                            ? "default"
                            : user.role === "mesero"
                              ? "secondary"
                              : user.role === "cajero"
                                ? "outline"
                                : "destructive"
                        }
                        className="text-[9px] sm:text-xs"
                      >
                        {user.role}
                      </Badge>
                      <Badge variant={user.active ? "default" : "secondary"} className="text-[9px] sm:text-xs">
                        {user.active ? "✅" : "❌"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => openEditModal(user)}
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                      title="Editar"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => toggleUserStatus(user.id)}
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                      title={user.active ? "Desactivar" : "Activar"}
                    >
                      {user.active ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => openResetPasswordModal(user)}
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                      title="Contraseña"
                    >
                      <Key className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editingUser={editingUser}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={closeResetPasswordModal}
        onSave={handleResetPassword}
        user={resetPasswordUser}
      />
    </div>
  )
}
