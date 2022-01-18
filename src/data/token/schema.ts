import mongoose, { Schema } from 'mongoose';
import Token from './interface';

const tokenSchema: Schema = new Schema<Token>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session_id: { type: String },
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  access_expires: { type: Schema.Types.Date },
  refresh_expires: { type: Schema.Types.Date },
  revoke: { type: Boolean, default: false },
});

export default mongoose.model('Token', tokenSchema);
