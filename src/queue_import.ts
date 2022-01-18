import { CallState } from './interfaces/state_call';

type UserEmail = {
  email: string,
};

type RoomInQueue = {
  room_id: string,
  title: string,
  expire_at: Date,
  members: Array<any>,
  stateRoom: CallState,
};

enum StateAddUserQueue {
  Added = 'added',
  Attended = 'attended',
  Wait = 'wait',
}

export { RoomInQueue, UserEmail, StateAddUserQueue };
