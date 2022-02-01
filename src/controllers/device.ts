import express, { Response, Request } from 'express';
import IControllerBase from '../interfaces/base';
import { upsertToken, unregisterToken } from '../services/device';

export default class DeviceController implements IControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  /**
 * @swagger
 * components:
 *   schemas:
 *     statusOk:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *     statusError:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         error:
 *           type: string
 */
  initRoutes() {
  /**
   * @swagger
   * /api/v1/device/register:
   *  post:
   *    summary: Upsert token device
   *    tags:
   *      - Device
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              token:
   *                type: string
   *              type:
   *                  type: string
   *    responses:
   *      200:
   *        description: return status OK
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/statusOk'
   *      404:
   *        description: token not found
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/statusError'
   *      500:
   *        description: unexpected error
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/statusError'
   */
    this.router.post('/device/register', DeviceController.register);

    /**
   * @swagger
   * /api/v1/device/unregister:
   *  post:
   *    summary: delete token device
   *    tags:
   *      - Device
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              token:
   *                type: string
   *    responses:
   *      200:
   *        description: return status OK
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/statusOk'
   *      404:
   *        description: token not found
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/statusError'
   *      500:
   *        description: unexpected error
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/statusError'
   */
    this.router.post('/device/unregister', DeviceController.unregister);
  }

  static register = async (req: Request & { userId: string }, res: Response) => {
    const { token, type } = req.body;
    if (!token || !type) {
      return res.status(404)
        .json({ status: false, error: 'token not found' });
    }
    console.log(token, type);
    const tokendb = await upsertToken(token, type, req.userId);

    if (tokendb.error) {
      return res.status(500)
        .json({ status: false, error: tokendb.error });
    }
    return res.status(200)
      .json({ status: true });
  };

  static unregister = async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(404)
        .json({ status: false, error: 'token not found' });
    }

    try {
      await unregisterToken(token);

      return res.status(200)
        .json({ status: true });
    } catch (err) {
      return res.status(500)
        .json({ status: false, error: err.message });
    }
  };
}
