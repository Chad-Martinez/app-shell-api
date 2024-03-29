import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/User.interface';

const userSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    default: 'USER',
  },
  refreshToken: {
    type: [String],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUser>('User', userSchema);
