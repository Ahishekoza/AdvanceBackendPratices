import mongoose, { Schema } from "mongoose";

const subscription = new Schema(
    {
        subscriber :{                             // Person who is a subscriber
            type: Schema.Types.ObjectId,
            ref:'User'
        },
        channel : {                          // To whom we are subscribing -- channel is one created by the person 
            type: Schema.Types.ObjectId,
            ref:'User'
        }
    }
    ,
    {timestamps: true}
    );

export const Subscription = mongoose.model("Subscription", subscription);
