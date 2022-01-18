import { format, addMinutes } from 'date-fns';
import express, { Request, Response } from 'express';
import Room from '../data/room/schema';
import User from '../data/user/schema';
import IControllerBase from '../interfaces/base';
import { CallState } from '../interfaces/state_call';
import {
  addRoomInQueue, addUserInRoomQueue,
  checkStateRoomQueue, leaveRoomQueue,
} from '../services/queue';
import getUser from '../services/users';
import { addUserFromRoom, changeStateRoom, getRoomFree } from '../services/rooms';
import { StateAddUserQueue } from '../queue_import';

class RoomController implements IControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    /**
     * @swagger
     * /room/{id}:
     *  post:
     *    summary: Join user from quet room
     *    responses:
     *      200:
     *        description: user add queue
     *      400:
     *        description: user or email not exist
     */
    this.router.post('/room/join/:room_id', RoomController.joinRoom);
    this.router.post('/room/join/', RoomController.joinAnyRoom);
    this.router.get('/room/:id', RoomController.checkRoom);
    this.router.post('/room/leave/:id', RoomController.leaveRoom);
    /**
     * @swagger
     * /room/create:
     *  post:
     *    summary: Create room
     *    responses:
     *      200:
     *        description: create new room
     *        content:
     *          application/json:
     *            schema:
     *              type: object
     *              properties:
     *                room:
     *                  type: string
     *      400:
     *        description: title not found
     */
    this.router.post('/room/create', RoomController.createRoom);
    /**
     * @swagger
     * /room/list:
     *  get:
     *    summary: List rooms
     *    responses:
     *      200:
     *        description: get list room
     *        content:
     *          application/json:
     *            schema:
     *              type: array
     *              items:
     *                type: Object
     *                example:
     *                  $ref: '#/components/schemas/User'
     *      400:
     *        description: email not found
     * components:
     *  schemas:
     *    User:
     *      type: Object
     *      properties:
     *        id:
     *          type: string
     *          example: "5fdedb7c25ab1352eef88f60"
     *        login:
     *          type: string
     *          example: testName
     *        password:
     *          type: string
     *          example: suPPer.Pass11ord
     *        email:
     *          type: string
     *          example: test@test.com
     *        mask:
     *          type: array
     *          items:
     *            type: string
     *            example: lion
     *        rating:
     *          type: integer
     *          example: 11
     *        token:
     *          type: string
     *          example: sjidoij0239ip32j32ro9eif-32i4pr32o4j32i0-023
     */
    this.router.get('/room/list', RoomController.listRooms);
  }

  static joinRoom = async (
    req: Request,
    res: Response,
  ) => {
    const [user, room] = await Promise.all([getUser(req), getRoomFree(req)]);

    if (!user || !room) return res.sendStatus(400);
    console.log(user, room);
    const queue = await addUserInRoomQueue(user);
    switch (queue) {
      case StateAddUserQueue.Attended:
        return res.status(409)
          .json({ message: 'you are in one of the rooms, expect other participants' });

      case StateAddUserQueue.Wait: {
        return res.status(200)
          .json({ message: 'no rooms available, you have been added to the queue' });
      }
      default:
        break;
    }
    if (!queue) return res.status(409).json({ message: 'Rooms is full, you is members of a room, you add in queue from room' });
    const status = await addUserFromRoom(room._id, room.members, user.email);

    if (!status) return res.status(409).json({ message: 'Rooms is full or you is members of a room' });

    return res.sendStatus(200);
  };

  static joinAnyRoom = async (
    req: Request,
    res: Response,
  ) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(404).json({ message: 'user not found' });

      await addUserInRoomQueue({ email: user.email });
    } catch (err) { console.log(err, 'room join any'); }

    return res.status(200).json({ message: 'you have been added to the queue' });
  };

  static createRoom = async (
    req: Request & { email: string },
    res: Response,
  ) => {
    const { titleRoom } = req.body;
    const { email } = req;

    if (!titleRoom) return res.sendStatus(400);

    const owner = await User.findOne({ email });
    const room = await Room.create({
      title: titleRoom,
      owner: owner.id,
      expire_at: format(addMinutes(new Date(), 5), 'MM.dd.yyyy HH:mm:ss'),
      members: [email],
      stateRoom: CallState.Wait,
    });

    await addRoomInQueue({
      room_id: room.id,
      title: room.title,
      expire_at: room.expire_at,
      members: [email],
      stateRoom: CallState.Wait,
    });

    return res.json({ room: room.id }).status(200);
  };

  static listRooms = async (
    req: Request & { email: string },
    res: Response,
  ) => {
    const { email } = req;

    if (!email) res.sendStatus(400);

    const list = await Room.find().exec();
    return res.json(list);
  };

  static checkRoom = async (
    req: Request,
    res: Response,
  ) => {
    const roomId = req.params.room_id;
    if (!roomId) return res.status(404).json({ message: 'room not found' });

    const user = await getUser(req);
    if (!user) return res.status(404).json({ message: 'user not found' });

    const stateRoom = await checkStateRoomQueue(roomId, user.email);
    if (!stateRoom) return res.status(404).json({ message: 'room not found or you no member her' });

    return res.status(200).json({ stateRoom });
  };

  static leaveRoom = async (
    req: Request,
    res: Response,
  ) => {
    const roomId = req.params.room_id;
    if (roomId) return res.status(404).json({ message: 'Room not found' });

    const user = await getUser(req);
    if (!user) return res.status(404).json({ message: 'user not found' });

    const result = await leaveRoomQueue(roomId, user.email);
    if (!result) return res.status(404).json({ message: 'Room not found' });

    await changeStateRoom(roomId, <CallState> await checkStateRoomQueue(roomId, user.email, true));
    return res.status(200).json({ message: 'You leave this room' });
  };
}

export default RoomController;
