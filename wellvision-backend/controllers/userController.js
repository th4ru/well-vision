// Importing the user model schema from models folder
import userModel from "../models/userModel.js";

/*
|--------------------------------------------------------------------------
| getUserData Controller
|--------------------------------------------------------------------------
| Fetches user details based on userId sent in the request body.
| Used for retrieving basic user info such as name and verification status.
*/
export const getUserData = async (req, res) => {
  try {
    // Extract userId from the request body
    const { userId } = req.body;

    // Find the user in the database by ID
    const user = await userModel.findById(userId);

    // If user not found, respond with an error
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // If user found, send success response with selected user data
    res.json({
      success: true,
      userData: {
        name: user.name,                    // User's name
        isAccountVerified: user.isAccountVerified  // Whether user has verified their account
      }
    });

  } catch (error) {
    // In case of any error, send failure response with error message
    res.json({ success: false, message: error.message });
  }
};
