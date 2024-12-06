import mongoose, { Schema , model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({

    videoFile: {
        type: String,
        required: true //url
    },

    thumbnail: {
        type: String, //url
        required: true
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String, 
        required: true
    },

    duration: {
        type: Number, //from video
        required: true
    },

    views: {
        type: Number,
        default: 0
    },

    isPublished: {
        type: Boolean,
        default: true
    }



},{timestamps: true});


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model("Video",videoSchema);