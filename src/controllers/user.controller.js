import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  return res
    .status(200)
    // cookie take 3 parameters name , value and option
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
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

  return res
  .status(200)
  // clear Cookie takes 2 parameters name and option
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(200,{}, "User logged out successfully")
  )
};

export { registerUser, loginUser ,logOutUser};
