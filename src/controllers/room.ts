import { format } from 'date-fns';
import express, { Request, Response } from 'express';
import io from 'socket.io-client';
import Room from '../data/room/schema';
import User from '../data/user/schema';
import IControllerBase from '../interfaces/base';
import CallState from '../interfaces/state_call';
import quete from '../quete_import';

class RoomController implements IControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    /**
     * @swagger
     * /room/{id}:
     *  get:
     *    summary: Join user from quet room
     *    responses:
     *      200:
     *        description: user add quet
     *      400:
     *        description: user or email not exist
     */
    this.router.get('/room/:id', RoomController.joinAnyRoom);
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

  static joinAnyRoom = async (
    req: Request & { email: string },
    res: Response,
  ) => {
    const { email } = req;
    if (!email) return res.sendStatus(400);
    const user = await User.findOne({ email });
    if (!user) return res.sendStatus(400);
    quete.quetUser.push(user.login);
    return res.sendStatus(200);
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
      createTime: format(new Date(), 'MM.dd.yyyy HH:mm:ss'),
      members: [email],
      stateCall: CallState.Init,
    });
    const socket = io('http://localhost:3000');
    socket.emit('join', { titleRoom, email });
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
}

export default RoomController;
