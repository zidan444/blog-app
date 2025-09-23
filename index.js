require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const { attachUserIfAny } = require("./middleware/auth");
const blogRoutes = require("./routes/blogRoutes");
const authRoutes = require("./routes/authRoutes");
const path = require("path");

const app = express();

// ===== Middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(cookieParser());

// ===== EJS setup =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



// ===== Routes =====

app.use(attachUserIfAny);
app.use((req, res, next) => {
  res.locals.userId = req.user?.id || null;
  next();
});
app.use("/", authRoutes);
app.use("/", blogRoutes);

// ===== Connect MongoDB + Start Server =====
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected...");

    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`🚀 Server running at http://localhost:${port}`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

startServer();
