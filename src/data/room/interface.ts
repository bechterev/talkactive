import { ObjectId } from 'mongoose';
import { CallState } from '../../interfaces/state_call';

export interface Room extends Document {
  title: string;
  owner: ObjectId;
  expire_at: Date;
  duraction: Date;
  members: Array<String>;
  stateRoom: CallState;
}
