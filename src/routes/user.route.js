import { Router } from "express";
import { getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, passwordUpdate, refreshAccessToken, registerUser, updateAccountDetails, updateImages } from "../controllers/user.controller.js";
import { upload } from "../middlewares/mulder.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes 
router.route("/logout").post(verifyJWT, logoutUser)

// refreshAccessToken 
router.route("/refresh-token").post(refreshAccessToken)
// update password
router.route("/change-password").patch(verifyJWT, passwordUpdate)
// loggedIn User Details
router.get('/profile', verifyJWT, getCurrentUser)
// update user details
router.route("/update-details").patch(verifyJWT, updateAccountDetails)
// update the image 
router.route("/update-image").patch(verifyJWT,upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),updateImages)

router.get('/:username',getUserChannelProfile);



export default router