import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = async (req, res) => {
  // get user details from frontend
  // validation - is anything empty or not
  // check if user is already registered
  // check if request contains any images or videos
  // upload the image and videos on the cloudinary
  // create object for User to save
  // check the response coming after saving the user
  // remove the password and refresh token while sending the response to client sever

  const { username, email, fullName, password } = req.body;

  //  iterates over the given array and will pass true or false if based on the value present in the array is empty or filled
  if (
    [username, email, fullName, password].some(
      (field) => !field || field?.trim === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if(existingUser){
    throw new ApiError(409,"User with username or email already registered");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  // CoverImage is the not required so we need to add a flag which will show where coverImage is present then assign the path to variable
  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }

 const avatar =  await uploadOnCloudinary(avatarLocalPath)
 const coverImage =  await uploadOnCloudinary(coverImageLocalPath)


 const user = await User.create({
  username: username,
  email: email,
  fullName:fullName,
  password:password,
  avatar:avatar.url,
  coverImage:coverImage?.url || "",

 })

 const createdUser =  await User.findById(user._id).select( '-password -refreshToken'  )

 if(!createdUser){
  throw new ApiError(500,"Something went wrong while registering the user")
 }


 res.status(201).json(
  new ApiResponse(201,createdUser,"User registered successfully")
 )
};

export { registerUser };
