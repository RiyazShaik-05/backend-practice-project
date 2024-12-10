import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User }  from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler( async(req,res) =>{
    // res.status(200).json({
    //     message: "OK ra"
    // })

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res



    const {userName,email,fullName,avatar,coverImage,password} = req.body;
    // console.log("Email: ",email);

    if ([userName, email, fullName, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }
    

    const existedUser = await User.findOne({
        $or: [{email}, {userName}]
    });

    if(existedUser){
        throw new ApiError(409,"User already Exitsts!");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    let coverImageLocalPath;
    
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // console.log(avatarLocalPath)
    // console.log(coverImageLocalPath)

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatarResponse) {return new ApiError(400,"Avatar is Required!!")};

    const user = await User.create({
        userName: userName.toLowerCase(),
        fullName,
        password,
        email,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse?.url || ""
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200,createdUser,"Ok andi succesfulle created"));
})


export {registerUser};