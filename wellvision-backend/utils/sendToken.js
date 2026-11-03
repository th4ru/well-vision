// utils/sendToken.js

import jwt from "jsonwebtoken";
import config from "../config/config.js";
import crypto from "node:crypto";

/*
|--------------------------------------------------------------------------
| sendToken Utility
|--------------------------------------------------------------------------
| Generates a JWT token and sends it in an HTTP-only cookie.
| Can be reused across login, register, or token refresh endpoints.
*/

const sendToken = (user, res) => {
  const jti = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  const token = jwt.sign(
    { id: user._id, jti },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  // Track session in DB (non-blocking best-effort)
  try {
    user.activeSessions = user.activeSessions || [];
    user.activeSessions.push({ jti, userAgent: res.req.headers['user-agent'] || '', ip: res.req.ip || '' });
    user.save().catch(() => {});
  } catch {}

  res.cookie("token", token, config.cookieOptions);

  return { token, jti };
};

export default sendToken;
