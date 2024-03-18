import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  // when I  am updating the user , i dont want it to validate with password
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

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

  if (existingUser) {
    throw new ApiError(409, "User with username or email already registered");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // CoverImage is the not required so we need to add a flag which will show where coverImage is present then assign the path to variable
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    username: username,
    email: email,
    fullName: fullName,
    password: password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
};

const loginUser = async (req, res) => {
  // get the user data
  // validate the password with the password present in the database
  // if password is correct , generate the access & refresh token
  // save the refresh token in the database
  // save the token in the cookie
  //  In user dont send password and refresh token
  // return response

  const { username, email, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({ $or: [{ username, email }] });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //  create options object for cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return (
    res
      .status(200)
      // cookie take 3 parameters name , value and option
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User Logined in successfully"
        )
      )
  );
};

const logOutUser = async (req, res) => {
  // reset the refresh token in the database
  // clear the cookies
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { $new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return (
    res
      .status(200)
      // clear Cookie takes 2 parameters name and option
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"))
  );
};

const refreshAccessToken = async (req, res) => {
  // get the refresh token via cookie || body
  // decode the refresh token
  // find the user from the decoded token
  // compare the refresh token got from the user and token saved in the database
  // if token is same then generate the access token and refresh token

  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!inComingRefreshToken) {
    throw new ApiError(401, "unauthorized access");
  }

  const decodeToken = jwt.verify(
    inComingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodeToken._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (inComingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token does not match");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken: accessToken, newRefreshToken: refreshToken },
        "Access Token Refreshed"
      )
    );
};

const changeCurrentPassword = async (req, res) => {
  // get the old and new password from the user
  // how to get password from the database , using the middleware verifyJwt
  // validate the old password with the password saved in the database
  // if validation is successful /  change the password and if fails throw an error

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
};

const currentUser = async (req, res) => {
  // we have middleware in the route which hold the user information
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "Current User information"));
};

const updateUserAccountDetails = async (req, res) => {
  // get the fields which user wants to update excluding images / password
  // validate whether the fields are not empty
  // find the user by ID and set the updated field
  // return the response

  const { fullName, username, email } = req.body;

  if (!fullName || !username || !email) {
    throw new ApiError(404, "Fields are empty");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName: fullName, username: username, email: email } },
    { $new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user },
        "User Account Details Updated Successfully"
      )
    );
};

const updateAvatarImage = async (req, res) => {
  // get the image from the user
  // get the user id from the middleware
  // upload the localpath of the image on the cloudinary and take the url of updated image
  // set the url in the user database avatar field
  // return response

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Image path not found");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(401, "Failed to upload avatar to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { $new: true }
  ).select("-password");


  return res
  .status(200)
  .json(
    new ApiResponse(200, {user:user},"Avatar Image Uploaded Successfully")
  )
};


const updateCoverImage = async (req, res) => {
  // get the image from the user
  // get the user id from the middleware
  // upload the localpath of the image on the cloudinary and take the url of updated image
  // set the url in the user database cover field
  // return response

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(404, "Image path not found");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(401, "Failed to upload avatar to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { $new: true }
  ).select("-password");


  return res
  .status(200)
  .json(
    new ApiResponse(200, {user:user},"Cover Image Uploaded Successfully")
  )
};

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  currentUser,
  updateUserAccountDetails,
  updateAvatarImage,
  updateCoverImage
};
