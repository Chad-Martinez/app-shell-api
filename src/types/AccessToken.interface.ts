import { JwtPayload } from 'jsonwebtoken';
import { Schema } from 'mongoose';
import { IUser } from './User.interface';

export interface IAccessToken extends JwtPayload {
  email: IUser['email'];
  roles: IUser['roles'];
}
