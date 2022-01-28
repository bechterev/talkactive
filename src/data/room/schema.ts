import mongoose, { Schema } from 'mongoose';
import { IRoom } from './interface';
import { CallState } from '../../interfaces/state_call';

const RoomSchema: Schema = new Schema<IRoom>({
  title: { required: true, type: String },
  owner: { type: mongoose.Schema.Types.ObjectId },
  expire_at: { required: true, type: Date },
  members: { type: [String], default: [] },
  members_leave: { type: [String], default: [] },
  stateRoom: {
    default: CallState.Init,
    type: String,
    enum: Object.values(CallState),
  },
});
export default mongoose.model<IRoom>('Room', RoomSchema);
