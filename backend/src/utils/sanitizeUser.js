// Retire les champs sensibles avant d'envoyer un user au client
export function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
