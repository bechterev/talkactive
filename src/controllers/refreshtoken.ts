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
          { expiresIn: '5m' },
        );
        return res.json({ accessToken });
      },
    );
    return res.sendStatus(200);
  };
}

export default RefreshTokenController;
