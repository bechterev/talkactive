import express,{Response,Request}  from "express";
import IControllerBase from "../interfaces/base";
import User from "../data/user/schema";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname,'../.env') });


class AuthController implements IControllerBase{
    error_body = {'message':'Email or password are requred'};
    public router = express.Router();
    constructor(){
        this.initRoutes()
    }
    initRoutes() {
        this.router.post('/signup', this.up);
        this.router.post('/signin',this.in);
        this.router.get('/logout',this.out);
    }
    up = async (req:Request, res:Response)=>{
        const {login, email, password} = req.body;
      
        if(!email||!password) return res.status(400).json(this.error_body);
        const duplicate = await User.findOne({email:email}).exec();

        if(duplicate) return res.status(409).json({'message':'error'});
        try{
            const hashPWD = await bcrypt.hash(password,Number(process.env.SALT_ROUND));
            await User.create({login,email,password:hashPWD});
        }
        catch(err){
            res.status(500).json({'message':err.message});
        }
    }
    in = async (req: Request, res: Response)=>{
        const {email,password} = req.body;
        if(!email||!password) return res.status(400).json(this.error_body);
        const user = await User.findOne({email:email});
        if(user){
            const pwdMatch = await bcrypt.compare(password,user.password);
            console.log(password,user.password, pwdMatch)
            if(!pwdMatch) return res.status(401).json({'message':'email or password not correct, try again'});
            else{
                const accessToken = jwt.sign(
                    {email:user.email},
                    process.env.ACCESS_TOKEN_SECRET,
                    {expiresIn: '5m'}
                );
                const refreshToken = jwt.sign(
                    {email:user.email},
                    process.env.REFRESH_TOKEN_SECRET,
                    {expiresIn: '1d'}
                );
                user.token = refreshToken;
                await user.save();
                res.cookie('jwt',refreshToken,{httpOnly:true, maxAge: 1000*60*60*24})
                res.status(200).json({accessToken})
            }
            
        }
        else return res.sendStatus(404);
    }
    out = async(req:Request, res:Response)=>{
        const cookie = req.cookies;
        if(!cookie?.jwt) return res.sendStatus(204);
        const refreshToken = cookie.jwt;
        const user = await User.findOne({token:refreshToken});
        if(!user) {
            res.clearCookie('jwt',{httpOnly:true});
            return res.sendStatus(204);
        }
        user.token='';
        await user.save();
        res.clearCookie('jwt', {httpOnly:true})
    }
}

export default AuthController;