import { JwtPayload } from 'jsonwebtoken';

export interface VerifyEmailToken extends JwtPayload {
  email: string;
}
