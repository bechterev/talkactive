import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import path from 'path';
import AuthController from './controllers/auth';
import RefreshTokenController from './controllers/refreshtoken';
import RoomController from './controllers/room';
import UserController from './controllers/user';
import App from './index';
import verifyJWT from './middlewares/jwtverfy';

dotenv.config({ path: path.join(__dirname, '../.env') });
// import loggerMiddleware from './middleware/logger'

const app = new App({
  port: Number(process.env.PORT),
  controllers: [
    new AuthController(),
    new UserController(),
    new RefreshTokenController(),
    new RoomController(),
  ],
  middleWares: [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    cookieParser(),
    //        loggerMiddleware
    verifyJWT,
  ],
  dbString: process.env.DB_STRING_LOCAL,
});

app.listen();
