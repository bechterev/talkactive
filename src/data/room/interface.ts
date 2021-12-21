import { ObjectId } from "mongoose";
import { CallState } from "src/interfaces/state_call";

export interface Room extends Document{
    title: string,
    owner:ObjectId,
    createTime: Date,
    duraction: Date,
    members: Array<String>,
    stateCall: CallState
} 
