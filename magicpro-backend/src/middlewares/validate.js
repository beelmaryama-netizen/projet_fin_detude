// Valide req.body avec un schéma Zod et remplace le body par la version nettoyée
// (les champs non prévus, comme "role", sont supprimés)
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

// Même chose pour les paramètres de l'URL (?role=EMPLOYEE...)
export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (err) {
    next(err);
  }
};
