const db = require('../../config/database');
const bcrypt = require('bcryptjs');

module.exports = async (payload) => {
  console.log("🔑 Servicio resetPassword iniciado");
  
  const { token, newPassword } = payload;

  if (!token || !newPassword) {
    throw new Error('Token y nueva contraseña son obligatorios');
  }

  if (newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    // Buscar el usuario por token y verificar que no haya expirado
    const [users] = await db.query(
      `SELECT id, name, email, reset_token_expiry 
       FROM users 
       WHERE reset_token = ? AND active = 1 AND reset_token_expiry > NOW()`,
      [token]
    );

    if (users.length === 0) {
      console.log("❌ Token inválido o expirado");
      throw new Error('Token de recuperación inválido o expirado');
    }

    const user = users[0];
    console.log(`🔍 Usuario encontrado para reset: ${user.email}`);

    // Encriptar la nueva contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar la contraseña y limpiar el token
    await db.query(
      `UPDATE users 
       SET password_hash = ?, 
           reset_token = NULL, 
           reset_token_expiry = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, user.id]
    );

    console.log(`✅ Contraseña restablecida para usuario: ${user.email}`);

    return { 
      message: "Contraseña restablecida exitosamente",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

  } catch (error) {
    console.error("❌ Error en resetPassword:", error);
    
    // Si es un error de validación específico, mantener el mensaje
    if (error.message.includes('Token') || error.message.includes('contraseña')) {
      throw error;
    }
    
    // Para otros errores, usar mensaje genérico
    throw new Error('Error interno del servidor');
  }
};
