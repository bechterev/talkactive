import mongoose, { Schema } from 'mongoose';
import { User } from './interface';

const UserSchema: Schema = new Schema<User>({
  login: { required: true, type: String },
  password: { required: true, type: String },
  email: { required: true, type: String },
  mask: { default: [], type: [String] },
  rating: { default: 0, type: Number },
  token: { default: '', type: String },
});
export default mongoose.model<User>('User', UserSchema);
