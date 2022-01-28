import { ObjectId } from 'mongoose';
import { CallState } from '../../interfaces/state_call';

export interface IRoom extends Document {
  title: string;
  owner?: ObjectId;
  expire_at: Date;
  members: Array<String>;
  members_leave: Array<String>;
  stateRoom: CallState;
}
