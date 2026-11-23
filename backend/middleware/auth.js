import jwt from 'jsonwebtoken';

// Customer sessions last 30 days. Tokens issued before expiry was added have no `exp`, so they
// are treated as expiring 30 days after they were issued (`iat`).
export const USER_TOKEN_TTL = '30d';
const LEGACY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Verify a customer token; throws if invalid or expired. */
export const verifyUserToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded.exp && (!decoded.iat || decoded.iat * 1000 < Date.now() - LEGACY_MAX_AGE_MS)) {
    throw new Error('Token expired');
  }
  return decoded;
};

const authUser = async (req, res, next) => {
  const token = req.headers.token;
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    const decoded = verifyUserToken(token);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export { authUser };
