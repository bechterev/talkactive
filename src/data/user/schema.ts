import mongoose, { Schema } from 'mongoose';
import { IUser } from './interface';

const UserSchema: Schema = new Schema<IUser>({
  login: { required: true, type: String },
  password: { required: true, type: String },
  email: { required: true, type: String },
  mask: { default: [], type: [String] },
  rating: { default: 0, type: Number },
  token: { default: '', type: String },
});
export default mongoose.model<IUser>('User', UserSchema);
