import express, { Response, Request } from 'express';
import IControllerBase from '../interfaces/base';
import { upsertToken, unregisterToken } from '../services/device';

export default class DeviceController implements IControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
  /**
   * @swagger
   * /api/v1/device/register:
   *  post:
   *    summary: Upsert token device
   *    requestBody:
   *      required: true
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                token:
   *                  type: string
   *                type:
   *                  type: string
   *    responses:
   *      description: token insert or update
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              status:
   *                type: boolean
   *              error:
   *                type: string
   *      200:
   *        description: return status OK
   *      404:
   *        description: token not found
   *      500:
   *        description: unexpected error
   */
    this.router.post('/device/register', DeviceController.register);

    /**
   * @swagger
   * /api/v1/device/unregister:
   *  post:
   *    summary: delete token device
   *    requestBody:
   *      required: true
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                token:
   *                  type: string
   *    responses:
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              status:
   *                type: boolean
   *              error:
   *                type: string
   *      200:
   *        description: return status OK
   *      404:
   *        description: token not found
   *      500:
   *        description: unexpected error
   */
    this.router.post('/device/unregister', DeviceController.unregister);
  }

  static register = async (req: Request & { userId: string }, res: Response) => {
    const { token, type } = req.body;
    if (!token || !type) return res.status(404).json({ status: false, error: 'token not found' });
    const tokendb = await upsertToken(token, type, req.userId);

    if (tokendb.error) return res.status(500).json({ status: false, error: tokendb.error });
    return res.status(200).json({ status: true });
  };

  static unregister = async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(404).json({ status: false, error: 'token not found' });
    try {
      await unregisterToken(token);
      return res.status(200).json({ status: true });
    } catch (err) { return res.status(500).json({ status: false, error: err.message }); }
  };
}
