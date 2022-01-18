import express, { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';
import IControllerBase from '../interfaces/base';
import User from '../data/user/schema';
import getUser from '../services/users';

class UserController implements IControllerBase {
  router = express.Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/user/change_pass', UserController.changePWD);
    this.router.post('/user/add_new_mask', UserController.addNewMask);
  }

  static changePWD = async (req: Request, res: Response) => {
    const { currentPWD, newPWD } = req.body;
    const cookie = req.cookies;

    if (!currentPWD || !newPWD) return res.sendStatus(400);
    const user = await User.findOne({ token: cookie.jwt });

    if (!user) return res.sendStatus(403);
    const matchOldPWD = await bcrypt.compare(currentPWD, user.password);

    if (!matchOldPWD) return res.sendStatus(404);
    user.password = await bcrypt.hash(newPWD, Number(process.env.SALT_ROUND));
    await user.save();

    return res.json(user.id);
  };

  static addNewMask = async (req: Request, res: Response) => {
    const { titleMask } = req.body;

    if (!titleMask) return res.sendStatus(400);
    const user = await getUser(req);

    if (!user) return res.sendStatus(403);
    user.mask.push(titleMask);
    await user.save();

    return res.json(user.id);
  };
}

export default UserController;
