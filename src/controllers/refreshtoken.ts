import express, { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import IControllerBase from '../interfaces/base';
import Token from '../data/token/schema';
import User from '../data/user/schema';
import generateToken from '../services/jwt_refresh';

class RefreshTokenController implements IControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    /**
     * @swagger
     * /api/v1/refresh:
     *  post:
     *    summary: User refresh token
     *    tags:
     *      - Refresh
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
     *        description: Token refresh
     *        content:
     *            application/json:
     *              schema:
     *                $ref: '#/components/schemas/statusOk'
     *      401:
     *        description: Email or password not correct, try again
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     */
    this.router.post('/refresh', RefreshTokenController.refresh);
  }

  static refresh = async (req: Request, res: Response) => {
    const { token } = req.body;
    const session = req.sessionID;
    if (!token) {
      return res.status(401)
        .json({ status: false, error: 'Invalid authorization' });
    }

    const tokenbd = await Token.findOne({
      session_id: session,
      refresh_token: token,
      refresh_expires: { $gte: Date.now() },
      revoke: false,
    });

    if (!tokenbd) return res.status(401).json({ status: false, error: 'Invalid authorization' });

    const user = await User.findOne({ _id: tokenbd.user_id });

    if (!user) {
      return res.status(401)
        .json({ status: false, error: 'Invalid authorization' });
    }
    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decode) => {
        if (err || user.id !== decode.user_id) {
          return res.status(401)
            .json({ status: false, error: 'Invalid authorization' });
        }

        return generateToken(req.sessionID, user.id)
          .then((tokens) => res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }));
      },
    );
    return res.status(200)
      .json({ status: true });
  };
}

export default RefreshTokenController;
