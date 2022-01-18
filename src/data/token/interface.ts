import { ObjectId } from 'mongoose';

export default interface Token extends Document {
  user_id: ObjectId,
  session_id: string,
  access_token: string,
  refresh_token: string,
  access_expires: Date,
  refresh_expires: Date,
  revoke: boolean,
}
