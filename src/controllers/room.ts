import express, { Request, Response } from 'express';
import Room from '../data/room/schema';
import User from '../data/user/schema';
import IControllerBase from '../interfaces/base';
import { CallState } from '../interfaces/state_call';
import { getUser, managedUser, getWaitUsersSize } from '../services/users';
import {
  addUserFromRoom, createRoom, getFreeRoom,
  leaveRoom, checkRoom,
} from '../services/rooms';
import ActionManageUser from '../interfaces/action_manage_user';

class RoomController implements IControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    /**
     * @swagger
     * /room/join/{room_id}:
     *  post:
     *    summary: User join concrete room
     *    responses:
     *      200:
     *        description: user add room
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/Schemas/Room'
     *      400:
     *        description: user or email not exist
     */
    this.router.post('/room/join/:room_id', RoomController.joinRoom);
    /**
     * @swagger
     * /room/join:
     *  post:
     *    summary: the user has been added to the queue to wait for a room
     *    responses:
     *      201:
     *        description: count list wait users
     *        content:
     *          application/json:
     *            schema:
     *              type: number
     *      409:
     *        description: the user is already in the queue
     *      400:
     *        description: user not add room
     */
    this.router.post('/room/join/', RoomController.joinAnyRoom);
    /**
     * @swagger
     * /room/{id}:
     *  get:
     *    summary: get status of a room
     *    responses:
     *      201:
     *        description: return a room to a member of this room
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/Schemas/Room'
     *      404:
     *        description: room not found
     *      500:
     *        description: an unexpected mistake
     */
    this.router.get('/room/:id', RoomController.checkRoom);
    /**
     * @swagger
     * /room/leave/{id}:
     *  post:
     *    summary: leave room
     *    responses:
     *      200:
     *        description: return a room to a member of this room
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/Schemas/Room'
     *      404:
     *        description: room not found
     *      500:
     *        description: an unexpected mistake
     */
    this.router.post('/room/leave/:id', RoomController.leaveRoom);
    /**
     * @swagger
     * /room/create:
     *  post:
     *    summary: Create room
     *    responses:
     *      200:
     *        description: leave room id
     *        content:
     *          application/json:
     *            schema:
     *              type: string
     *      404:
     *        description: not found room
     *        content:
     *          application/json:
     *            schema:
     *              type: object
     *              properties:
     *                message:
     *                  type: string
     *      500:
     *        description: an unexpected mistake
     *        content:
     *          application/json:
     *            schema:
     *              type: object
     *              properties:
     *                message:
     *                  type: string
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
     *      type: object
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
     *    Room:
     *      type: object
     *      properties:
     *        id:
     *          type: string
     *          example: "5fdedb7c25ab1352eef88f60"
     *        title:
     *          type: string
     *        owner:
     *          type: string
     *        members:
     *          type: Array
     *          items:
     *            type: string
     *        expire_at:
     *          type: string
     *          format: date
     *        stateRoom:
     *          type: string
     */
    this.router.get('/room/list', RoomController.listRooms);
  }

  static joinRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const user = await getUser(req.userId);

    if (!user || !req.params.room_id) return res.sendStatus(404);

    const stateRoom = await addUserFromRoom(req.params.room_id, user);
    if (stateRoom) return res.status(200).json({ message: `you add from room ${stateRoom}` });

    return res.status(409).json({ message: `you not add from room ${req.params.room_id}` });
  };

  static joinAnyRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const user = await getUser(req.userId);
    if (!user) return res.status(404).json({ message: 'user not found' });

    try {
      const freeRooms = await getFreeRoom();
      const waitRoom = freeRooms.find((room) => room.members.some((el) => el === user.id));

      if (!waitRoom) {
        try {
          await managedUser(user.id, ActionManageUser.Add);
          return res.status(201).json({
            message: `expect other participants, now ${await getWaitUsersSize()} people are waiting for a room`,
          });
        } catch (error) {
          res.json({ error: error.message });
        }
      }
      res.status(409).json({ message: 'the user is in one of the rooms' });
    } catch (err) {
      return res.status(400).json({ message: `user not add room, because ${err}` });
    }
    return res.status(400).json({ message: 'user not add room' });
  };

  static createRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const { titleRoom } = req.body;
    const { userId } = req;

    if (!titleRoom) return res.sendStatus(400);

    const owner = await User.findOne({ _id: userId });
    let room;
    if (!owner) return res.status(404).json({ message: 'User not found' });
    try {
      room = await createRoom({
        title: titleRoom,
        owner: owner.id,
        expire_at: new Date(),
        members: [owner.id],
        stateRoom: CallState.Wait,
      });
    } catch (err) { res.status(400).json(`Error from create room: ${err}`); }

    return res.json({ room }).status(201);
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
    req: Request & { userId: string },
    res: Response,
  ) => {
    const roomId = req.params.id;

    if (!roomId) return res.status(404).json({ message: 'room not found' });
    try {
      const stateRoom = await checkRoom(roomId, req.userId);
      if (!stateRoom) return res.status(404).json({ message: 'room not found or you no member her' });
      return res.status(200).json({ stateRoom });
    } catch (err) {
      res.status(404).json({ message: err.message });
    }

    return res.status(500).json({ message: 'error enternal' });
  };

  static leaveRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const roomId = req.params.room_id || req.params.id;

    if (!roomId) return res.status(404).json({ message: 'Room not found' });
    try {
      const user = await getUser(req.userId);
      if (!user) return res.status(404).json({ message: 'user not found' });

      const result = await leaveRoom(roomId, user.id);
      if (!result) return res.status(404).json({ message: 'Room not found' });

      return res.status(200).json(result);
    } catch (err) {
      console.log(err);
    }
    return res.status(500).json({ message: 'enternal error' });
  };
}

export default RoomController;
