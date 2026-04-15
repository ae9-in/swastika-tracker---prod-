import { ZodError } from 'zod';

export function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.validated = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next({ statusCode: 400, message: error.issues[0]?.message || 'Invalid request payload' });
      }
      return next(error);
    }
  };
}
