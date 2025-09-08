const express = require("express");
const router = express.Router();
const User = require("../models/user");


// ===== Signup (GET) =====
router.get("/signup", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("signup", { error: null });
});

// ===== Signup (POST) =====
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("signup", { error: "Email already in use. Try another." });
    }

    const user = new User({ username, email, password });
    await user.save();

    req.session.userId = user._id;
    req.session.username = user.username;

    res.redirect("/");
  } catch (err) {
    console.error("Signup error:", "min 6 char");
    res.render("signup", { error: "min 6 char"});
  }
});



// ===== Login (GET) =====
router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("login");
});

// ===== Login (POST) =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.send("No account with that email.");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.send("Incorrect password.");

    // store session
    req.session.userId = user._id;
    req.session.username = user.username;

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error logging in. Try again.");
  }
});

// ===== Logout =====
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
