import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User }  from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


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
});

const generateAccessAndRefreshTokens = async (userID) => {

    try{

        const user = await User.findById(userID);
        // console.log(user);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validityBeforeSave: false});

        return { accessToken , refreshToken };

    }catch(error){
        throw new ApiError(500,"Error Generating Tokens!");
    }


}

const loginUser = asyncHandler( async (req,res) => {
    
    //take data from req
    // check if username or email exists
    //find the user
    //check password
    //generate refresh and access tokens
    //update refreshtoken field of logged in user
    //update cookies
    //

    const { userName, email, password} = req.body;
    // return res.status(200).json(new ApiResponse(200,req.data,"hi"));
    if(!(userName || email)) { throw new ApiError(400,"Credentials Required!") };

    const user = await User.findOne({
        $or: [{ userName },{ email }]
    });

    if(!user) { throw new ApiError(404,"User doesn't exist");}

    const userExists = await user.isPasswordCorrect(password);

    if(!userExists) { throw new ApiError(401,"Invalid Credentials!") };

    // console.log(user._id);

    const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken,
            },
            "User Logged in Successfully!"
        )
    )
});

const logoutUser = asyncHandler( async(req,res) => {
    
    await User.findByIdAndUpdate(req.user._id,{
        $set: {
            refreshToken : undefined
        }
    },
    {
        new : true
    })

    const options = {
        httpOnly: true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User LoggedOut"));
});

const refreshAccessToken = asyncHandler( async(req,res) => {

    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

        if(!incomingRefreshToken) { throw new ApiError(401,"Unauthorized Request (getting  token)") };

        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        

        const user = await  User.findById(decodedToken._id);

        if(!user) { throw new ApiError("Unauthorized request (finding USer)")};

        if(incomingRefreshToken !== user?.refreshToken) { throw new ApiError(401,"Unauthorized Request (not equal tokens)")};

        const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .cookies("accessToken",accessToken,options)
        .cookies("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken},"Successfully generated"));

        
    } catch (error) {
        throw new ApiError(401,"Error Refreshing AccessToken");
        
    };
})

const changeCurrentPassword = asyncHandler( async(req,res) =>{
    const { oldPassword , newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const correctPassword = user.isPasswordCorrect(oldPassword);

    if(!correctPassword) { throw new ApiError(400,"Invalid old Password")};

    user.password = newPassword;

    await user.save({validityBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password Changed Successfully")
    );
     
});

const getCurrentUser = asyncHandler( async(req,res) => {
    return res.status(200,{},new ApiResponse(200,req.user,"current User Ftched Successfully"));
})

const updateAccountDetails = asyncHandler( async(req,res) => {
    const {fullName , email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All Fields required");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullName: fullName,
            email: email
        }
    },{new : true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account Detail Updated Successfully"
    ));
});

const updateUserAvatar = asyncHandler( async(req,res) => {
    const avatarLocalFilePath = req.file?.path;

    if(!avatarLocalFilePath) { throw new ApiError(400,"Avatar file is missing")};

    const avatarResponse = uploadOnCloudinary(avatarLocalFilePath);

    if(!avatarResponse.url) { throw new ApiError(400,"Error while uploading on avatr")};

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $:{
            avatar: avatarResponse.url
        }
    },{new: true}).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar changed Suucesfully")
    )
})

const updateUserCoverImage = asyncHandler( async(req,res) => {
    const coverImageLocalFilePath = req.file?.path;

    if(!coverImageLocalFilePath) { throw new ApiError(400,"Cover Image file is missing")};

    const coverImageResponse = uploadOnCloudinary(avatarLocalFilePath);

    if(!coverImageResponse) { throw new ApiError(400,"Error while uploading Cover Image on Cloudinary")};

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $:{
            coverImage: coverImageResponse.url
        }
    },{new: true}).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverImage changed Suucesfully")
    )
})

export { registerUser , loginUser , logoutUser , refreshAccessToken , updateAccountDetails , getCurrentUser , changeCurrentPassword , updateUserCoverImage, updateUserAvatar };