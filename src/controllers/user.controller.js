import { asyncHanlder } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        console.log(user);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHanlder(async (req, res) => {

    const { username, fullname, email, password } = req.body;


    if (
        [username, fullname, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, `Email or Username already in use`);
    }


    const avatarLocalPath = req.files?.avatar[0]?.path
    const converImageLocalPath = req.files?.coverImage[0]?.path


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is Required");
    }
    // Save image to cloudinary and get the url of images

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(converImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Failed to save Avatar Image on Cloudinary")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password,
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong While Registering ")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully...!!!")
    )

    // // console.log(User);
    // console.log(req.files);
    // res.status(200).json(req.files)
    // // get user details from frontend 
    // // validation
    // // check if user already exists
    // // check for images, check for avatar
    // // upload them to cloudinary , avatar
    // // create user object - create entry in db
    // // remove password and refresh token field from response
    // // check for user creation
    // // return response

    // // const {username,email,fullname,password} = req.body;
    // // console.log(req.body);
    // // console.log(`email : ${email}`);
})


const loginUser = asyncHanlder(async (req, res) => {
    // my algorithms
    // get email and password from user 
    // check user with email exists or not 
    // if user exist check password is correct or not 
    // if password is correct then login 
    // redirect it to dashboard

    /**
     * Sir's Algorithm
     * req.body -> data
     * username or email
     * find the user 
     * password check
     * access and refresh token
     * send cookie
     */

    const { email, password } = req.body

    if (!email) {
        throw new ApiError(400, "Email Is Required Field..!!")
    }
    if (!password) {
        throw new ApiError(400, "Password Is Required Field..!!")
    }
    let user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'User Doesn\'t Exist Or Invalid Email')
    }

    const isValidPassord = await user.isPasswordCorrect(password);

    if (!isValidPassord) {
        throw new ApiError(401, 'Invalid Password')
    }

    // Send Access & Refresh Token

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }, "User Logged in Successfully")
        )

})

const logoutUser = asyncHanlder(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))

})

const refreshAccessToken = asyncHanlder(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized Request");
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id);
    
        if (!user) {
            throw new ApiError(404, 'Invalid Refresh Token')
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }
        //Generate a new Access Token and update the refresh token of the user
        const option = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, refreshTokenNew } = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshTokenNew, options)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: refreshTokenNew },"Access Token refreshed Successfully")
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Token")
    }
})

export { registerUser, loginUser, logoutUser,refreshAccessToken }