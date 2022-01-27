import mongoose, { Schema } from 'mongoose';
import { IDevice } from './interface';
import OS from '../../interfaces/os';

const deviceSchema: Schema = new Schema<IDevice>(
  {
    user_id: { type: Schema.Types.ObjectId },
    token: { required: true, type: String },
    type: { type: String, enum: Object.values(OS) },
  },
  { timestamps: true },
);
export default mongoose.model('Device', deviceSchema);
