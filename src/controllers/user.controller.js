import { asyncHanlder } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



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


export { registerUser }