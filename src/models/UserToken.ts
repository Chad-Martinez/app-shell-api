import mongoose, { Schema } from 'mongoose';
import { IUserToken } from '../types/UserToken.interface';
import { v4 as uuidV4 } from 'uuid';

const userTokenSchema: Schema<IUserToken> = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  refreshToken: { type: String, required: true },
  family: { type: String, default: uuidV4(), required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUserToken>('UserToken', userTokenSchema);
