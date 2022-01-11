import express, { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import IControllerBase from '../interfaces/base';
import User from '../data/user/schema';

class RefreshTokenController implements IControllerBase {
  error_body = { message: 'Email or password are requred' };

  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  /**
   * @swagger
   * /api/v1/refresh:
   *  get:
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
    this.router.get('/refresh', RefreshTokenController.refresh);
  }

  static refresh = async (req: Request, res: Response) => {
    const cookie = req.cookies;
    if (!cookie?.jwt) return res.sendStatus(401);
    const refreshToken = cookie.jwt;
    const user = await User.findOne({ token: refreshToken });
    if (!user) return res.sendStatus(403);
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decode) => {
        if (err || user.email !== decode.email) return res.sendStatus(403);
        const accessToken = jwt.sign(
          { email: decode.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '15m' },
        );
        user.token = refreshToken;
        user.save();
        res.cookie('jwt', refreshToken, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24,
        });
        return res.json({ accessToken });
      },
    );
    return res.sendStatus(200);
  };
}

export default RefreshTokenController;
