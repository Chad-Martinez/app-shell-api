import { JwtPayload } from 'jsonwebtoken';
import { IUser } from './User.interface';

export interface IAccessToken extends JwtPayload {
  email: IUser['email'];
  roles: IUser['roles'];
}
