import * as bcrypt from 'bcrypt';
import express, { Response, Request } from 'express';
import IControllerBase from '../interfaces/base';
import User from '../data/user/schema';
import Token from '../data/token/schema';
import generateToken from '../services/jwt_refresh';

class AuthController implements IControllerBase {
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
     *    tags:
     *      - Registration
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
     *        content:
     *          application/json:
     *            schema:
     *              type: object
     *              properties:
     *                accessToken:
     *                  type: string
     *                refreshToken:
     *                  type: string
     *      400:
     *        description: The required data is missing
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     *      409:
     *        description: Data is not uniq
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     *      500:
     *        description: Internal error
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     */
    this.router.post('/signup', AuthController.signup);

    /**
     * @swagger
     * /api/v1/signin:
     *  post:
     *    summary: Authenticate user
     *    tags:
     *      - Login
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
     *                  refreshToken:
     *                    type: string
     *      400:
     *        description: The required data is missing
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     *      401:
     *        description: Email or password not correct, try again
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     */
    this.router.post('/signin', AuthController.signin);

    /**
     * @swagger
     * /api/v1/logout:
     *  get:
     *    summary: Log out user
     *    tags:
     *      - Logout
     *    responses:
     *      200:
     *        description: return status OK
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusOk'
     *      500:
     *        description: unexpected error
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/statusError'
     */
    this.router.get('/logout', AuthController.logout);
  }

  static signup = async (req: Request, res: Response) => {
    const { login, email, password } = req.body;

    if (!email || !password) {
      return res.status(400)
        .json({ status: false, error: 'Email or password are requred' });
    }

    try {
      const duplicate = await User.findOne({ email }).exec();

      if (duplicate) {
        return res.status(409)
          .json({ status: false, error: 'duplicate email' });
      }

      const hashPWD = await bcrypt.hash(
        password,
        Number(process.env.SALT_ROUND),
      );
      const user = await User.create({ login, email, password: hashPWD });

      return res.status(201)
        .json({ status: true, token: await generateToken(req.sessionID, user.id) });
    } catch (error) {
      return res.status(500)
        .json({ status: false, error: error.message });
    }
  };

  static signin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400)
        .json({ status: false, error: 'Email or password are requred' });
    }
    try {
      const user = await User.findOne({ email });

      if (user) {
        const pwdMatch = await bcrypt.compare(password, user.password);

        if (!pwdMatch) {
          return res
            .status(401)
            .json({ status: false, error: 'email or password not correct, try again' });
        }

        return res.status(201)
          .json({ status: true, token: await generateToken(req.sessionID, user.id) });
      }

      return res.status(404)
        .json({ status: false, error: 'user not found' });
    } catch (error) {
      return res.status(500)
        .json({ status: false, error: error.message });
    }
  };

  static logout = async (req: Request, res: Response) => {
    try {
      await Token.updateMany(
        { revoke: false, session_id: req.sessionID },
        { revoke: <any>true },
      );

      return res.status(200)
        .json({ status: true });
    } catch (error) {
      return res.status(500)
        .json({ status: false, error: error.message });
    }
  };
}

export default AuthController;
