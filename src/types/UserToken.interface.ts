import { Document } from 'mongodb';
import { Schema } from 'mongoose';

export interface IUserToken extends Document {
  userId: Schema.Types.ObjectId;
  refreshToken: string;
  tokenFamily: string;
  createdAt: Date;
}
