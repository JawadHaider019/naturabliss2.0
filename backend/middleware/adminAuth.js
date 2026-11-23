import jwt from "jsonwebtoken";

const getToken = (req) =>
  req.headers.token || req.headers.authorization?.replace("Bearer ", "");

/**
 * Returns the decoded payload if the request carries a valid ADMIN token, otherwise null.
 *
 * Only tokens issued by adminLogin carry `isAdmin: true`. Customer tokens (createToken in
 * userController) also contain an `email`, so an email alone must never count as admin.
 */
export const getAdminFromRequest = (req) => {
  const token = getToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.isAdmin === true || decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
};

const adminAuth = (req, res, next) => {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    // 401 lets the admin panel's interceptor log out cleanly when the session has expired
    return res.status(401).json({ success: false, message: "Not Authorized Login Again" });
  }
  req.adminEmail = admin.email;
  next();
};

export default adminAuth;
