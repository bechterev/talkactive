import { Request } from 'express';
import { format, addMinutes } from 'date-fns';
import { CallState, callStateArray } from '../interfaces/state_call';
import Room from '../data/room/schema';
import { IRoom } from '../data/room/interface';
import { genTitle } from './util';

const getRoom = async (req: Request) => {
  const roomId = req.params.room_id;
  const room = await Room.findOne({ _id: roomId });

  return room;
};

const checkRoom = async (id: string, userId: string) => {
  const roomId = id;
  const room = await Room.findOne({
    _id: roomId,
    members: { $elemMatch: { $eq: userId } },
  });

  return room;
};

const addUserFromRoom = async (
  roomId: string,
  user: any,
) => {
  let room;
  try {
    room = await Room.findOne({ _id: roomId });
    if (room.members.includes(roomId) || room.members.length === 3) return false;
    room.members.push(user.id);
    room.stateRoom = callStateArray[room.members.length];
    if (room.stateRoom !== CallState.Work) room.expire_at = addMinutes(new Date(), 5);
    await room.save();
  } catch (err) {
    return room;
  }
  return room;
};

const changeStateRoom = async (roomId: string, stateRoom: CallState) => {
  const result = await Room.updateOne({ _id: roomId }, { stateRoom });

  if (!result) return false;

  return true;
};

const createRoom = async (data: Partial<IRoom>, availableFreeRoom?: boolean) => {
  try {
    const result = await Room.create({
      title: availableFreeRoom ? await genTitle() : data.title,
      owner: data.owner,
      expire_at: format(addMinutes(new Date(), 5), 'MM.dd.yyyy HH:mm:ss'),
      members: data.members ? [data.members[0]] : [],
      stateRoom: data.members ? CallState.Wait : CallState.Init,
    });
    return result;
  } catch (err) { return err; }
};

const getFreeRoom = async () => {
  let rooms;

  try {
    rooms = await Room.find({
      expire_at: { $gt: new Date() },
      $or: [{ stateRoom: CallState.Init }, { stateRoom: CallState.Wait }],
    });
  } catch (err) { return err; }

  if (rooms.length === 0) {
    try {
      rooms = [await createRoom({}, true)];
    } catch (err) { return err; }
    return rooms;
  }

  return rooms;
};

const leaveRoom = async (roomId: string, user_id: string) => {
  const room = await Room.findOne({ _id: roomId });
  if (!room) throw new Error('room not found');

  switch (room.stateRoom) {
    case CallState.Wait:
      room.members.splice(room.members.indexOf(user_id), 1);
      break;
    case CallState.Init:
      room.members.splice(0, 1);
      break;
    default:
      break;
  }
  room.stateRoom = callStateArray[room.members.length];
  await room.save();

  return room.id;
};

export {
  getRoom,
  checkRoom,
  addUserFromRoom,
  changeStateRoom,
  createRoom,
  getFreeRoom,
  leaveRoom,
};
