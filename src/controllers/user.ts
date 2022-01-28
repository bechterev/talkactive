import express, { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';
import IControllerBase from '../interfaces/base';
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

  static changePWD = async (req: Request & { userId: string }, res: Response) => {
    const { currentPWD, newPWD } = req.body;
    if (!currentPWD || !newPWD) {
      return res.status(400)
        .json({ status: false, error: 'Not found old or new password' });
    }

    try {
      const user = await getUser(req.userId);

      if (!user) {
        return res.status(404)
          .json({ status: false, error: 'user not found' });
      }

      const matchOldPWD = await bcrypt.compare(currentPWD, user.password);

      if (!matchOldPWD) {
        return res.status(409)
          .json({ status: false, error: 'new password and old password not equal' });
      }

      user.password = await bcrypt.hash(newPWD, Number(process.env.SALT_ROUND));
      await user.save();

      return res.status(200)
        .json({ status: true, user });
    } catch (error) {
      return res.status(500)
        .json({ status: false, error: error.message });
    }
  };

  static addNewMask = async (req: Request, res: Response) => {
    const { titleMask } = req.body;

    if (!titleMask) {
      return res.status(404)
        .json({ status: false, error: 'Not found title of mask' });
    }
    try {
      const user = await getUser(req.params.user_id);

      if (!user) {
        return res.status(404)
          .json({ status: false, error: 'user not found' });
      }

      user.mask.push(titleMask);
      await user.save();

      return res.status(200)
        .json({ status: true, user });
    } catch (error) {
      return res.status(500)
        .json({ status: false, message: error.message });
    }
  };
}

export default UserController;
