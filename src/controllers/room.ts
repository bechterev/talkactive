import  express, {Request, Response} from "express";
import IControllerBase from "../interfaces/base";
import { CallState } from "../interfaces/state_call";
import Room from "../data/room/schema";
import User from "../data/user/schema";
import { quete } from "../server";
import {format} from "date-fns";
import { Socket } from "socket.io";

class RoomController implements IControllerBase{
    public router = express.Router();
    constructor(){
        this.initRoutes();
    }
    initRoutes() {
        this.router.get('/room/:id',this.joinAnyRoom);
        this.router.post('/room/create',this.createRoom);
        this.router.get('/room/list',this.listRooms);
    }
    joinAnyRoom =async (req:Request &{ email:string}, res:Response) => {
        const email = req.email;
        if(!email) return res.sendStatus(400);
        const user = await User.findOne({email});
        if(!user) return res.sendStatus(400);
        quete.quetUser.push(user.login)
        return res.sendStatus(200);
    }
    createRoom = async(req: Request & {email:string}, res: Response) =>{
        const io = req.app.get('socketio');
        const {titleRoom} = req.body;
        const email = req.email;
        if(!titleRoom) return res.sendStatus(400);
        const owner = await User.findOne({email});
        const room = await Room.create({
            title:titleRoom,
            owner:owner.id,
            createTime: format(new Date, 'MM.dd.yyyy HH:mm:ss'),
            members:[email],
            stateCall:CallState.Init
        });
    
        io.of('/room/create').on("connection",(socket:Socket)=>{
            console.log("socket create");
            socket.emit("welcome","Hello creator");
        })
    return res.json({room:room.id}).status(200);
    }
    listRooms = async(req:Request & {email:string}, res:Response)=>{
        const email = req.email;
        if(!email) res.sendStatus(400);
        const list = await Room.find().exec();
        return res.json(list);
    }
}
export default RoomController;