import { ObjectId } from 'mongoose';
import OS from '../../interfaces/os';

export interface IDevice extends Document {
  user_id: ObjectId;
  token: string;
  type: OS;
  timestamps: any;
}
