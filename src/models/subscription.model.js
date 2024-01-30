import mongoose, { Schema } from "mongoose";
import { asyncHanlder } from "../utils/asyncHandler";


const subscriptionSchema = new Schema(
    {
        subscriber:{
            type: Schema.Types.ObjectId,
            ref:"User",
        },
        channel:{
            type: Schema.Types.ObjectId,
            ref:"User",
        }
    },
    {
        timestamps: true,
    }
)


export const Subscription = mongoose.model("Subscription",subscriptionSchema)