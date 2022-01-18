import { format, addMinutes } from 'date-fns';
import { RoomInQueue, StateAddUserQueue, UserEmail } from '../queue_import';
import Room from '../data/room/schema';
import { CallState } from '../interfaces/state_call';
import { genTitle } from './util';

const queue = {
  queueUser: new Set<UserEmail>(),
  queueRoom: Array<RoomInQueue>(),
};

const addRoomInQueue = async (room: RoomInQueue) => {
  queue.queueRoom.push(room);
};

const findFreeRoomQueue = async () => {
  const room = queue.queueRoom.find(
    (el) => el.expire_at > new Date()
    && (el.stateRoom === CallState.Init || el.stateRoom === CallState.Wait),
  );
  return room;
};

const findFreeRoomAllQueue = async () => {
  const rooms = queue.queueRoom.filter(
    (el) => el.stateRoom === CallState.Init || el.stateRoom === CallState.Wait,
  );
  return rooms;
};

const addUserInQueue = async (email: UserEmail) => {
  const freeRooms = await findFreeRoomQueue();
  if (!freeRooms) {
    const room = await Room.create({
      title: await genTitle,
      expire_at: format(addMinutes(new Date(), 5), 'MM.dd.yyyy HH:mm:ss'),
      members: [],
      stateRoom: CallState.Init,
    });
    await addRoomInQueue({
      room_id: room._id,
      title: room.title,
      expire_at: room.expire_at,
      members: room.members,
      stateRoom: CallState.Init,
    });
  }
  if (queue.queueUser.has(email)) return false;
  queue.queueUser.add(email);
  return true;
};

const addUserInRoomQueue = async (email: UserEmail) : Promise<StateAddUserQueue> => {
  const room = await findFreeRoomQueue();
  if (!room) {
    await addUserInQueue(email);
    return StateAddUserQueue.Wait;
  }
  if (room.members.includes(email)) return StateAddUserQueue.Attended;
  // room.members.push(email.email);
  // room.expire_at = addMinutes(new Date(), 5);
  if (queue.queueUser.has(email)) return StateAddUserQueue.Wait;

  queue.queueUser.add(email);
  return StateAddUserQueue.Added;
};

const checkStateRoomQueue = async (roomId: string, email: string, onlyState: boolean = true) => {
  const room = await queue.queueRoom
    .find((el) => el.room_id === roomId && el.members.includes(email));

  if (onlyState) return room.stateRoom;

  return room;
};

const leaveRoomQueue = async (roomId: string, email: string) => {
  const room: RoomInQueue = <RoomInQueue> await checkStateRoomQueue(roomId, email, false);
  if (!room) return false;

  switch (room.stateRoom) {
    case CallState.Wait:
      room.members.splice(room.members.indexOf(email), 1);
      room.stateRoom = CallState.Init;
      return true;
    case CallState.Init:
      room.members.splice(0, 1);
      room.stateRoom = CallState.Leave;
      return true;
    default:
      break;
  }
  return false;
};

const getListUsersQueue = async () => queue.queueUser;

const updateManyRoomQueue = async (changeRoomsQueue: Array<RoomInQueue>) => {
  queue.queueRoom = changeRoomsQueue;
};

const changeListUsersQueue = async (list: Set<UserEmail>) => {
  queue.queueUser = list;
};

export {
  addRoomInQueue,
  findFreeRoomQueue,
  findFreeRoomAllQueue,
  addUserInRoomQueue,
  addUserInQueue,
  checkStateRoomQueue,
  leaveRoomQueue,
  getListUsersQueue,
  updateManyRoomQueue,
  changeListUsersQueue,
};
