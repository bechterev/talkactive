import express, { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import IControllerBase from '../interfaces/base';
import Token from '../data/token/schema';
import User from '../data/user/schema';
import generateToken from '../services/jwt_refresh';

class RefreshTokenController implements IControllerBase {
  error_body = { message: 'Email or password are requred' };

  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  /**
   * @swagger
   * /api/v1/refresh:
   *  post:
   *    summary: Create a JSON
   *    responses:
   *      description: Authenticate user success
   *      content:
   *        application/jwt:
   *          schema:
   *            type: string
   *      200:
   *      headers:
   *        Set-Cookie:
   *          schema:
   *            type: string
   *            example: JWT=abcde12345sadasdasdqwe3423e3=; Path=/; HttpOnly
   *      401:
   *        description: Cookie auth not correct, try again
   *      403:
   *        description: User not found
   */
  initRoutes() {
    this.router.post('/refresh', RefreshTokenController.refresh);
  }

  static refresh = async (req: Request, res: Response) => {
    const { token } = req.body;
    const session = req.sessionID;
    if (!token) return res.sendStatus(401);

    const tokenbd = await Token.findOne({
      session_id: session,
      refresh_token: token,
      refresh_expires: { $gte: Date.now() },
      revoke: false,
    });

    if (!tokenbd) return res.sendStatus(401);

    const user = await User.findOne({ _id: tokenbd.user_id });

    if (!user) return res.sendStatus(401);
    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decode) => {
        if (err || user.id !== decode.user_id) return res.sendStatus(401);

        return generateToken(req.sessionID, user.id)
          .then((tokens) => res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }));
      },
    );
    return undefined;
  };
}

export default RefreshTokenController;
