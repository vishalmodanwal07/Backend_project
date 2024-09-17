import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
   
    videoFile:{
        type : String, //from cloudinary
        required :true
    },
    thumbnail:{
        type : String, //from cloudinary
        required :true
    },
    title:{
        type : String, //from cloudinary
        required :true
    },
    description :{
        type : String ,
        required : true
    },
    duration :{
        type : String, //from cloudinary
        required :true
    },
    views :{
        type : Number,
        default : 0
    },
   isPublised:{
        type : Boolean , //from cloudinary
        default : true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref : "User"
        
    }


},{
    timestamps :true
})
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video" , videoSchema)