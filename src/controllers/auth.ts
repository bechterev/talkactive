import * as bcrypt from 'bcrypt';
import express, { Response, Request } from 'express';
import IControllerBase from '../interfaces/base';
import User from '../data/user/schema';
import Token from '../data/token/schema';
import generateToken from '../services/jwt_refresh';

class AuthController implements IControllerBase {
  static error_body = { message: 'Email or password are requred' };

  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    /**
     * @swagger
     * /api/v1/signup:
     *  post:
     *    summary: Create a JSONPlaceholder user
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              login:
     *                type: string
     *              password:
     *                type: string
     *              email:
     *                type: string
     *    responses:
     *      201:
     *        description: Create user
     *      400:
     *        description: The required data is missing
     *      409:
     *        description: Data is not uniq
     *      500:
     *        description: Internal error
     */
    this.router.post('/signup', AuthController.signup);
    /**
     * @swagger
     * /api/v1/signin:
     *  post:
     *    summary: Authenticate user
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              email:
     *                type: string
     *              password:
     *                type: string
     *    responses:
     *      200:
     *        description: Authenticate user success
     *        content:
     *            application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  accessToken:
     *                    type: string
     *        headers:
     *          Set-Cookie:
     *            schema:
     *              type: string
     *              example: JWT=abcde12345sadasdasdqwe3423e3=; Path=/; HttpOnly
     *      400:
     *        description: The required data is missing
     *      401:
     *        description: Email or password not correct, try again
     *        content:
     *            application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  message: string
     */
    this.router.post('/signin', AuthController.signin);
    /**
     * @swagger
     * /api/v1/logout:
     *  get:
     *    summary: Log out user
     *    responses:
     *      204:
     *        description: Clear jwt
     *      200:
     *        description: Clear jwt
     * components:
     *  securitySchemes:
     *    cookieAuth:
     *      type: apiKey
     *      in: cookie
     *      name: jwt
     */
    this.router.get('/logout', AuthController.logout);
  }

  static signup = async (req: Request, res: Response) => {
    const { login, email, password } = req.body;

    if (!email || !password) return res.status(400).json(this.error_body);

    const duplicate = await User.findOne({ email }).exec();

    if (duplicate) return res.status(409).json({ message: 'error' });

    try {
      const hashPWD = await bcrypt.hash(
        password,
        Number(process.env.SALT_ROUND),
      );
      await User.create({ login, email, password: hashPWD });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }

    return res.sendStatus(201);
  };

  static signin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json(this.error_body);
    const user = await User.findOne({ email });

    if (user) {
      const pwdMatch = await bcrypt.compare(password, user.password);

      if (!pwdMatch) {
        return res
          .status(401)
          .json({ message: 'email or password not correct, try again' });
      }

      return res.status(200).json(await generateToken(user.email, req.sessionID, user.id));
    }

    return res.sendStatus(404);
  };

  static logout = async (req: Request, res: Response) => {
    const tokens = await Token.find({}).where({ revoke: false, session_id: req.sessionID });

    if (tokens) {
      const listTokenUpdate = tokens.map((el) => el.id);
      await Token.updateMany({ _id: { $in: listTokenUpdate } }, { revoke: <any>true });
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  };
}

export default AuthController;
