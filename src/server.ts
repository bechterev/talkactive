import App from './index'
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname,'../.env') });
import * as bodyParser from 'body-parser';
import verifyJWT from './middlewares/jwtverfy';
import cookieParser from "cookie-parser";

//import loggerMiddleware from './middleware/logger'

import AuthController from './controllers/auth';
import UserController from './controllers/user';
import RefreshTokenController from './controllers/refreshtoken';
import RoomController from './controllers/room';
const app = new App({
    port:  Number(process.env.PORT),
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
    dbString:process.env.DB_STRING_LOCAL
})
export const quete = {quetUser:[]}
app.listen();

