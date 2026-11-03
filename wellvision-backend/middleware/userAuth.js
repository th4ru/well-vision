import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  let token = req.cookies.token;

  // Fallback to Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ DEBUG: Log the decoded token
    console.log("✅ Decoded Token:", tokenDecode);

    if (tokenDecode.id) {
      req.user = { id: tokenDecode.id };
      next();
    } else {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token. Please login again." });
  }
};

export default userAuth;
