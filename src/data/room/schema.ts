import mongoose, { Schema } from 'mongoose';
import { Room } from './interface';
import { CallState } from '../../interfaces/state_call';

const RoomSchema: Schema = new Schema<Room>({
  title: { required: true, type: String },
  owner: { required: true, type: mongoose.Schema.Types.ObjectId },
  expire_at: { required: true, type: Date },
  duraction: { type: Date },
  members: { type: [String], default: [] },
  stateRoom: {
    default: CallState.Init,
    type: String,
    enum: Object.values(CallState),
  },
});
export default mongoose.model<Room>('Room', RoomSchema);
