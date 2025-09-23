const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { generateToken } = require("../middleware/auth");

// ===== Signup (GET) =====
router.get("/signup", (req, res) => {
  if (req.cookies.token) return res.redirect("/");
  res.render("signup", { error: null });
});

// ===== Signup (POST) =====
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("signup", { error: "Email already in use." });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user);
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
  



    res.redirect("/");
  } catch (err) {
    console.error("Signup error:", err.message);
    res.render("signup", { error: "Error signing up. Try again." });
  }
});

// ===== Login (GET) =====
router.get("/login", (req, res) => {
  if (req.cookies.token) return res.redirect("/");
  res.render("login", { error: null });
});

// ===== Login (POST) =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.render("login", { error: "No account with that email." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.render("login", { error: "Incorrect password." });

    const token = generateToken(user);
    console.log(token);
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

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
