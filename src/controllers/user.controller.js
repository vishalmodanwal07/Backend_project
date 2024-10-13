import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId)=>{
   try {
      const user = await User.findById(userId);
      const refreshToken = user.generateAccessToken();
      const accessToken = user.generateAccessToken();
      user.refreshToken=refreshToken;
      await user.save({ validateBeforeSave : false})
      return {accessToken , refreshToken}
   } catch (error) {
     throw new ApiError(500 , "something went wrong while generating refresh token and access token") 
   }
}



const registerUser = asyncHandler( async (req , res)=>{
   const {fullName , email , username ,password} = req.body
   console.log("email : " , email);
   console.log("username  : " , username);
   console.log(req.body);
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
// const coverImageLocalPath = req.files?.coverImage[0]?.path;

let coverImageLocalPath;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
}

console.log(req.files);
//check forr avatar
if(!avatarLocalPath){
   throw new ApiError(400 , "avatar is required");
}

//image upload on cloudinary 
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);
//validation for avatar
if(!avatar){
   throw  new ApiError(400 , "avatar is require");
}

//create user in db 
const user = await User.create(
   {
      fullName,
      avatar : avatar.url,
      coverImage : coverImage?.url || " ",
      email,
      password,
      username : username.toLowerCase()
   }
);

const createdUser = await User.findById(user._id).select("-password -refreshToken");

if(!createdUser){
   throw new ApiError(500 , "something went wrong while regitering user ")
}

//responce
return res.status(201).json(
   new ApiResponse(200, createdUser,"user created successfully")
)
})

const loginUser = asyncHandler(async(req , res )=>{
//  req.body-->data
//  username or email
//  find the user
//  check password 
//  get access token and refresh token in form of cookie

const {username , password , email} = req.body;
console.log(email);
if(!username && !email){
   throw new ApiError(400 , "username or email are required");
}
 const user =await User.findOne({
   $or : [{username} , {email}]
 })

 if(!user){
   throw new ApiError(404 , "user doesnot exist");
 }
 const isPasswordValid = await user.isPasswordCorrect(password);
 if(!isPasswordValid){
   throw new ApiError(401 , "user password incorrect");
 }

const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);
console.log(accessToken)
console.log(refreshToken)
const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

const options ={
   httpOnly : true,
   secure : true
}

return res
.status(200)
.cookie("refreshToken" , refreshToken , options)
.cookie("accessToken" , accessToken , options)
.json(
    new ApiResponse(
    200,
   {
      user : loggedInUser , accessToken , refreshToken
   },
"user loggedin successful")
)

})



const logoutUser = asyncHandler(async(req , res)=>{
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set : {
            refreshToken :undefined
         }
      },
      {
         new : true
      }
   )
   const options ={
      httpOnly : true,
      secure :true
   }
   return res
   .status(200)
   .clearCookie("refreshToken", options)
   .clearCookie("accessToken", options)
   .json(new ApiResponse(200 , {}, "user logged out"))
})

const refreshAccessToken = asyncHandler(async(req , res )=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
   if(!incomingRefreshToken){
      throw new ApiError(401, "unauthorized refresh token")
   }
   try {
      const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
      const user =await User.findById(decodedToken?._id);
      if(!user){
         throw new ApiError(401 , "invalid refresh token");
      }
      if(incomingRefreshToken!==user?.refreshToken){
         throw new ApiError(401 , "refesh token is expired or used");
      }
      const options ={
         httpOnly :true,
         secure : true
      }
      const { accessToken , newrefreshToken} = await generateAccessAndRefreshToken(user._id)
      return res
      .status(200)
      .cookie("accessToken" , accessToken , options)
      .cookie("refreshToken" , newrefreshToken , options)
      .json(
         new ApiResponse(200 , 
            {accessToken , refreshToken:newrefreshToken},
            "Access Token refreshed"
         )
      )
   } catch (error) {
      throw new ApiError(401 , error?.message || "invalid refresh token")
   }
})


const changeCurrentPassword = asyncHandler(async(req, res)=>{
   const {oldPassword , newPassword} = req.body;
   const user =await User.findById(req.user?._id);
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
      throw new ApiError(400 , "invalid password ")
   }
   user.password =newPassword;
   await user.save({validateBeforeSave: false})
   return res
   .status(200)
   .json(new ApiResponse(200 , {} , "password change successfully"))
})

const getCurrentUser =asyncHandler(async(req , res)=>{
   return res
   .status(200)
   .json(200 ,req.user , "current user fetched successfully")
})

const updateAccountDetails= asyncHandler(async(req , res)=>{
   const {fullName , email} = req.body;
   if(!fullName || !email){
      throw new ApiError(400 , "all fields are required")
   }
   const user =await User.findByIdAndUpdate(req.user?._id , {
          $set :{
            fullName ,
            email
          }
   },
{new :true}).select("-password")

return res
.status(200)
.json(new ApiResponse(200 ,user,  "account detail updated successfully"))
})


const updateUserAvatar =asyncHandler(async(req , res)=>{
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400 , "avatar file is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   if(!avatar.url){
      throw new ApiError(400 , "error while uploading on avatar")

   }

  const user = await User.findByIdAndUpdate(req.user?._id , 
      {
         $set : {
            avatar : avatar.url
         }
      },
      {new :true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200 , user , "avatar is updated successfully"))
   
})

const updateCoverImage =asyncHandler(async(req , res)=>{
   const coverImageLocalPath = req.file?.path
   if(!coverImageLocalPath){
      throw new ApiError(400 , "coverImage file is missing")
   }
   const coverImage= await uploadOnCloudinary(coverImageLocalPath );
   if(!coverImage.url){
      throw new ApiError(400 , "error while uploading on coverImage")

   }

  const user = await User.findByIdAndUpdate(req.user?._id , 
      {
         $set : {
            coverImage : coverImage.url
         }
      },
      {new :true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200 , user , "coverImage is updated successfully"))
   
})
export {registerUser ,
        loginUser , 
        logoutUser, 
        refreshAccessToken ,
        changeCurrentPassword ,
        getCurrentUser ,
        updateAccountDetails ,
        updateUserAvatar, 
        updateCoverImage
      }  