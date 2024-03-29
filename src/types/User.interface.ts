import { Document } from 'mongodb';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  refreshToken: Array<string>;
  isEmailVerified?: boolean;
  dateCreated?: Date;
  dateUpdated?: Date;
}
