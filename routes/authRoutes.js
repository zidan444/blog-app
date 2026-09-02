const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { generateToken } = require("../middleware/auth");

// ===== Signup (GET) =====
router.get("/signup", (req, res) => {
  if (req.cookies && req.cookies.token) return res.redirect("/");
  res.render("signup", { error: null });
});

// ===== Signup (POST) =====
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || username.trim().length < 3) {
      return res.render("signup", { error: "Username must be at least 3 characters long." });
    }

    if (!email || !email.includes("@")) {
      return res.render("signup", { error: "Please enter a valid email address." });
    }

    if (!password || password.length < 6) {
      return res.render("signup", { error: "Password must be at least 6 characters long." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.render("signup", { error: "That email is already registered. Please log in." });
    }

    const existingUsername = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, "i") });
    if (existingUsername) {
      return res.render("signup", { error: "That username is already taken. Please choose another." });
    }

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password
    });
    await user.save();

    const token = generateToken(user);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);

    res.redirect("/");
  } catch (err) {
    console.error("Signup error:", err);
    res.render("signup", { error: err.message || "Error signing up. Please try again." });
  }
});

// ===== Login (GET) =====
router.get("/login", (req, res) => {
  if (req.cookies && req.cookies.token) return res.redirect("/");
  res.render("login", { error: null });
});

// ===== Login (POST) =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", { error: "Please enter both email and password." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.render("login", { error: "No account found with that email." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.render("login", { error: "Incorrect password." });

    const token = generateToken(user);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Error logging in." });
  }
});

// ===== Logout =====
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

module.exports = router;
