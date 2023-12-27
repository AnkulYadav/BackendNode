import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHanlder } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHanlder(async (req, res, next) => {
   try {
      
      const token = req.cookies?.accessToken || req.header("Authrization")?.replace("Bearer ", "");
      
      if (!token) {
         throw new ApiError(401, "Unautherized Accesss");
      }
      
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

      if (!user) {  
         throw new ApiError(401, "User not found!")
      }
      req.user = user;
      next()
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Token ")
   }

})