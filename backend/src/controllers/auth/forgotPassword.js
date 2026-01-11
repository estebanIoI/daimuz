const db = require('../../config/database');
const crypto = require('crypto');

module.exports = async (payload) => {
  console.log("🔐 Servicio forgotPassword iniciado");
  
  const { email } = payload;

  if (!email) {
    throw new Error('El email es obligatorio');
  }

  try {
    // Verificar si el usuario existe
    const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ? AND active = 1', [email]);
    
    if (users.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      console.log("📧 Email no encontrado, pero enviando respuesta exitosa por seguridad");
      return { message: "Si el email existe en nuestro sistema, recibirás las instrucciones para restablecer tu contraseña." };
    }

    const user = users[0];
    
    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora de validez

    // Guardar el token en la base de datos
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Crear el enlace de recuperación
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Simular envío de email (hasta configurar SMTP)
    console.log("📧 EMAIL SIMULADO:");
    console.log("📧 Para:", email);
    console.log("👤 Usuario:", user.name);
    console.log("� URL de recuperación:", resetUrl);
    console.log("⏰ Expira en:", resetTokenExpiry);

    return { 
      message: "Se ha enviado un correo con las instrucciones para restablecer tu contraseña.",
      // Solo en desarrollo, mostrar la URL
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined 
    };

  } catch (error) {
    console.error("❌ Error en forgotPassword:", error);
    throw new Error('Error interno del servidor');
  }
};
