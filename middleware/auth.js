const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallbacksecret";

// Generate a JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// Verify JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware for protected routes
function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/login");

  const decoded = verifyToken(token);
  if (!decoded) return res.redirect("/login");

  req.user = decoded;
  next();
}

// Middleware to attach user if available (not required)
function attachUserIfAny(req, res, next) {
  const token = req.cookies?.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) req.user = decoded;
  }
  next();
}

module.exports = { generateToken, verifyToken, isLoggedIn, attachUserIfAny };
