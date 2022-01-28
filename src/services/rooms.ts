import { Request } from 'express';
import { format, addMinutes } from 'date-fns';
import { CallState, callStateArray } from '../interfaces/state_call';
import Room from '../data/room/schema';
import { IRoom } from '../data/room/interface';
import { genTitle } from './util';
import { notifyFinish, notifyWork } from './notification';

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
  try {
    const room = await Room.findOne({ _id: roomId });
    if (room.members.length === 3) return false;

    if (room.members.includes(user.id)) return room;

    room.members.push(user.id);

    room.stateRoom = callStateArray[room.members.length];

    if (room.stateRoom !== CallState.Work) room.expire_at = addMinutes(new Date(), 5);

    await room.save();

    return room;
  } catch (err) {
    return err;
  }
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
  } catch (err) {
    return err;
  }
};

const getFreeRoom = async (userId?: string) => {
  try {
    let rooms = await Room.find({
      expire_at: { $gt: new Date() },
      $or: [{ stateRoom: CallState.Init }, { stateRoom: CallState.Wait }],
    });

    if (!userId) return { rooms, newRoom: false, error: false };

    if (rooms.length === 0) {
      const newRoomParams = userId ? { members: [userId] } : {};

      rooms = [await createRoom(newRoomParams, true)];

      return { rooms, newRoom: true, error: false };
    }

    const waitRoom = rooms.find((room) => room.members.some((el) => el === userId));

    if (waitRoom) return { rooms: waitRoom, newRoom: false, error: false };

    rooms[0].members.push(userId);

    if (rooms[0].members.length === 3) {
      rooms[0].stateRoom = CallState.Work;

      await notifyWork(rooms[0].members, rooms[0].id);
    }

    rooms[0].expire_at = addMinutes(new Date(), 5);

    await rooms[0].save();

    return { rooms: rooms[0], newRoom: false, error: false };
  } catch (error) {
    return {
      rooms: undefined,
      newRoom: false,
      error: error.message,
    };
  }
};

const leaveRoom = async (roomId: string, user_id: string) => {
  const room = await Room.findOne({ _id: roomId, user_id });

  if (!room) return { status: false, error: 'room not found' };

  const indexLeaveUser = room.members.indexOf(user_id);

  if (indexLeaveUser === -1) return { status: false, error: 'room not found' };

  const leaveUser = room.members.splice(indexLeaveUser, 1);

  room.members_leave.push(leaveUser[0]);

  if (room.stateRoom === CallState.Work && room.members.length === 0) {
    await notifyFinish(room);

    room.stateRoom = CallState.Finish;
  } else if (room.stateRoom === CallState.Wait && room.members.length === 1) {
    room.stateRoom = CallState.Init;
  } else if (room.stateRoom === CallState.Init && room.members.length === 0) {
    room.stateRoom = CallState.Leave;
  }

  await room.save();

  return room;
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
