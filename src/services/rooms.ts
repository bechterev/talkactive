import { Request } from 'express';
import { format, addMinutes } from 'date-fns';
import { CallState } from '../interfaces/state_call';
import Room from '../data/room/schema';

const getRoom = async (req: Request) => {
  const roomId = req.params.room_id;
  const room = await Room.findOne({ _id: roomId });

  return room;
};

const getRoomFree = async (req: Request) => {
  const roomId = req.params.room_id;
  const room = await Room.findOne({
    _id: roomId,
    stateRoom: CallState.Wait,
  });

  return room;
};

const addUserFromRoom = async (
  roomId: string,
  members: Array<String>,
  userEmail: string,
  stateRoom?: CallState,
) => {
  if (members.includes(userEmail)) return false;

  const objUpdate: { members: Array<String>, expire_at: any, stateRoom?: CallState } = {
    members,
    expire_at: format(addMinutes(new Date(), 5), 'MM.dd.yyyy HH:mm:ss'),
  };
  if (stateRoom) objUpdate.stateRoom = stateRoom;

  members.push(userEmail);
  await Room.updateOne(
    { _id: roomId },
    objUpdate,
  );

  return true;
};
const changeStateRoom = async (roomId: string, stateRoom: CallState) => {
  const result = await Room.updateOne({ _id: roomId }, { stateRoom });

  if (!result) return false;

  return true;
};

export {
  getRoom,
  getRoomFree,
  addUserFromRoom,
  changeStateRoom,
};
