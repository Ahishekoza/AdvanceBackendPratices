import mongoose , {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        video:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
        },
        duration:{         // cloudinary will give all the specifies
            type:Number,
            required:true
            
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"  
        }


    },
    {
        timestamps: true
    }
    
    );


export const Video = mongoose.model('Video',videoSchema);