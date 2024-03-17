import express from "express";
import { logOutUser, loginUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const route = express.Router();

// upload.fields is a middleware which is used when you have to upload more than one image fields in the schema
route.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

route.post('/login',loginUser)
route.delete('/logout',verifyJwt,logOutUser)

export default route;
