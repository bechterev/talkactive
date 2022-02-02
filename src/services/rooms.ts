import { Request } from 'express';
import { format, addMinutes } from 'date-fns';
import { CallState } from '../interfaces/state_call';
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

    if (room.members.length === 2) room.stateRoom = CallState.Wait;

    if (room.members.length < 2) room.stateRoom = CallState.Init;

    if (room.members.length === 3) {
      room.stateRoom = CallState.Work;

      await notifyWork(room.members, room.id);
    }

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

const getFreeRoom = async (userId: string) => {
  try {
    const room = await Room.findOne({
      expire_at: { $gt: new Date() },
      $or: [{ stateRoom: CallState.Init }, { stateRoom: CallState.Wait }],
    });
    if (room) {
      const waitRoom = room.members.some((el) => el === userId);

      if (waitRoom) return { room: waitRoom, newRoom: false, error: false };

      room.members.push(userId);

      if (room.members.length === 3) {
        room.stateRoom = CallState.Work;

        await notifyWork(room.members, room.id);
      }

      room.expire_at = addMinutes(new Date(), 5);

      await room.save();

      return { room, newRoom: false, error: false };
    }
    const newRoomParams = userId ? { members: [userId] } : {};

    const newRoom = await createRoom(newRoomParams, true);

    return { room: newRoom, newRoom: true, error: false };
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
    try {
      await notifyFinish(room);

      room.stateRoom = CallState.Finish;
    } catch (e) { return { status: false, error: e.message }; }
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
