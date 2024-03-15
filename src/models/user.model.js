import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      // cloudinary
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    refreshToken: {
      type: String,
      
    },
    watchHistory: [
      // watch history = [ {} , {} ]
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

// pre is a mongoose inbuilt middleware which we can invoke on the bases of the methods
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


//  we can create a method
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// we don't need async await as
userSchema.methods.generateAccessToken = function () {
  const payload = {
    _id: this._id,
    username: this.username,
    email: this.email,
  };
  const secret_key = process.env.ACCESS_TOKEN_SECRET;

  return jwt.sign(payload, secret_key, {
    expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY}`,
  });
};


// It's important to note that although this method doesn't explicitly take parameters, it utilizes the context of the instance (this._id) 
userSchema.methods.generateRefreshToken = function () {
    const payload = {
      _id: this._id,
      
    };
    const secret_key = process.env.REFRESH_TOKEN_SECRET;
  
    return jwt.sign(payload, secret_key, {
      expiresIn: `${process.env.REFRESH_TOKEN_EXPIRY}`,
    });
  };

export const User = mongoose.model("User", userSchema);
