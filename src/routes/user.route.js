import express from "express";
import { changeCurrentPassword, currentUser, logOutUser, loginUser, refreshAccessToken, registerUser, updateAvatarImage, updateCoverImage, updateUserAccountDetails } from "../controllers/user.controller.js";
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
route.post('/refresh-token',refreshAccessToken)
route.post('/change-password',verifyJwt,changeCurrentPassword)
route.post('/current-user',verifyJwt,currentUser)
route.put('/update-accountDetails',verifyJwt,updateUserAccountDetails)
route.put('/update-avatar',verifyJwt,upload.single('avatar'),updateAvatarImage)
route.put('/update-coverImage',verifyJwt,upload.single('coverImage'),updateCoverImage)
route.delete('/logout',verifyJwt,logOutUser)

export default route;
