import express from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.js";

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

export default route;
