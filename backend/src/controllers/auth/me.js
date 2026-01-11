module.exports = async function me(_, req) {
  if (!req.user) {
    throw new Error("No autorizado.");
  }

  return {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    lastLogin: req.user.last_login
  };
};
