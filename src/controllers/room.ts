import express, { Request, Response } from 'express';
import User from '../data/user/schema';
import IControllerBase from '../interfaces/base';
import { CallState } from '../interfaces/state_call';
import { getUser } from '../services/users';
import {
  addUserFromRoom, createRoom, getFreeRoom,
  leaveRoom, checkRoom,
} from '../services/rooms';

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
     *    parameters:
     *      - in: path
     *      name: room_id
     *      required: true
     *      schema:
     *        type: string
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
     *    parameters:
     *      - in: path
     *      name: id
     *      required: true
     *      schema:
     *        type: string
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
     *    parameters:
     *      - in: path
     *      name: id
     *      required: true
     *      schema:
     *        type: string
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
     *    parameters:
     *      - in: path
     *      name: id
     *      required: true
     *      schema:
     *        type: string
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
     *    parameters:
     *      - in: path
     *      name: id
     *      required: true
     *      schema:
     *        type: string
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
    try {
      const user = await getUser(req.userId);

      if (!user || !req.params.room_id) {
        return res.status(404)
          .json({ status: false, error: 'Parameter room or user not found' });
      }

      const room = await addUserFromRoom(req.params.room_id, user);
      if (room) return res.status(200).json({ status: true, room });

      return res.status(409).json({ status: false, error: `you not add from room ${req.params.room_id}` });
    } catch (error) { return res.status(500).json({ status: false, error: error.message }); }
  };

  static joinAnyRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    try {
      const user = await getUser(req.userId);

      if (!user) return res.status(404).json({ status: false, error: 'user not found' });

      const freeRooms = await getFreeRoom(user.id);
      if (freeRooms.error) return res.status(500).json({ status: false, error: freeRooms.error });

      // пользователь добавлен в очередь, крон разрулит
      if (!freeRooms.newRoom) return res.status(202).json({ status: true });

      return res.status(201).json({ status: true, room: freeRooms.rooms });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message });
    }
  };

  static createRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const { titleRoom } = req.body;
    const { userId } = req;

    try {
      if (!titleRoom) return res.status(400).json({ status: false, error: 'Parameter room not found' });

      const owner = await User.findOne({ _id: userId });

      if (!owner) return res.status(404).json({ status: false, error: 'User not found' });

      const room = await createRoom({
        title: titleRoom,
        owner: owner.id,
        expire_at: new Date(),
        members: [owner.id],
        stateRoom: CallState.Wait,
      });

      return res.status(201).json({ status: true, room });
    } catch (error) { return res.status(400).json({ status: false, error: error.message }); }
  };

  static listRooms = async (
    req: Request,
    res: Response,
  ) => res.status(200).json({ status: true, error: 'test' });
    // const { userId } = req;
    // if (!userId) res.sendStatus(400);
    /* let list;
    try { list = await Room.find(); } catch (err) { console.log(err); } */

  static checkRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const roomId = req.params.id;

    if (!roomId) return res.status(404).json({ status: false, error: 'room not found' });

    try {
      const room = await checkRoom(roomId, req.userId);
      if (!room) return res.status(404).json({ status: false, error: 'room not found or you no member her' });
      return res.status(200).json({ status: true, room });
    } catch (error) {
      return res.status(404).json({ status: false, message: error.message });
    }
  };

  static leaveRoom = async (
    req: Request & { userId: string },
    res: Response,
  ) => {
    const roomId = req.params.room_id || req.params.id;

    if (!roomId) return res.status(404).json({ status: false, error: 'Room not found' });
    try {
      const user = await getUser(req.userId);
      if (!user) return res.status(404).json({ status: false, error: 'user not found' });

      const result = await leaveRoom(roomId, user.id);
      if (!result) return res.status(404).json({ status: false, error: 'Room not found' });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message });
    }
  };
}

export default RoomController;
