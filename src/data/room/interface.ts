import { ObjectId } from 'mongoose';
import CallState from '../../interfaces/state_call';

export interface Room extends Document {
  title: string;
  owner: ObjectId;
  createTime: Date;
  duraction: Date;
  members: Array<String>;
  stateCall: CallState;
}
