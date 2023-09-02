import { Document } from 'mongodb';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  refreshToken: Array<string>;
  dateCreated?: Date;
  dateUpdated?: Date;
}
