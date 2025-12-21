import { AuthenticatedUser } from '../../auth/middleware/jwt.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
