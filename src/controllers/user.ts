import  express, { Response, Request }  from "express";
import IControllerBase from "../interfaces/base";
import User from "../data/user/schema";
import * as bcrypt from "bcrypt";

class UserController implements IControllerBase{

    router = express.Router();
    constructor(){
        this.initRoutes();
    }
    initRoutes() {
       this.router.post('/user/change_pass',this.changePWD); 
       this.router.post('/user/add_new_mask',this.addNewMask); 
    }
    changePWD = async(req:Request, res:Response)=>{
        const {currentPWD, newPWD} = req.body;
        const cookie = req.cookies;
        if(!currentPWD||!newPWD) return res.sendStatus(400);
        const user= await User.findOne({token:cookie.jwt})
        if(!user) return res.sendStatus(403);
        const matchOldPWD = await bcrypt.compare(currentPWD,user.password);
        if(!matchOldPWD) return res.sendStatus(404);
        user.password = await bcrypt.hash(newPWD,Number(process.env.SALT_ROUND));
        await user.save();
        res.json(user.id);
    }
    addNewMask = async(req:Request, res:Response)=>{
        const {titleMask} = req.body;
        const cookie = req.cookies;
        if(!titleMask) return res.sendStatus(400);
        const user= await User.findOne({token:cookie.jwt})
        if(!user) return res.sendStatus(403);
        user.mask.push(titleMask);
        await user.save();
        res.json(user.id);
    }
}

export default UserController;