import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv";
dotenv.config();

const verifyJwt = async (req, _, next) => {
  // get the token from cookie or header
  // decode the token
  // get the user using the decoded token which does not contain password , refresh token
  // create new object user

  try {
    const token =
      req.cookies?.accesstoken || req.headers.authorization.split(" ")[1];
    if (!token) {
      return new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
};


export { verifyJwt }
