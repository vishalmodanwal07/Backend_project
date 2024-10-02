import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser =asyncHandler( async (req , res)=>{
   const {fullname , email , username ,password} = req.body
   console.log("email : " , email);
   console.log("usename  : " , username);
//validation
   if(
    [fullName , email , username , password ].some((field)=> field?.trim() === "")
   ){
    throw new ApiError(400 , "all fileds are required")
   }


//checking user exit or not
const existedUser = await User.findOne({$or: [{ username } , { email }]});
if(existedUser){
   throw new ApiError(409 , "user with email or usename already exist");
}

//image upload
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

//check forr avatar
if(!avatarLocalPath){
   throw new ApiError(400 , "avatar is required");
}

//image upload on cloudinary 
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);
//validation for avatar
if(! avatar){
   throw  new ApiError(400 , "avatar is required");
}

//create user in db 
const user = await User.create(
   {
      fullname,
      avatar : avatar.url,
      coverImage : coverImage?.url || " ",
      email,
      password,
      username : username.toLowerCase()
   }
);
const createdUser = await User.findById(user._id).select("-password - refershToken");
if(!createdUser){
   throw new ApiError(500 , "something went wrong while regitering user ")
}

//responce
return res.status(201).json(
   new ApiResponse(200, createdUser,"user created successfully")
)
})


export {registerUser}