require("dotenv").config();
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const { attachUserIfAny } = require("./middleware/auth");
const blogRoutes = require("./routes/blogRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require('./routes/upload');


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
  res.locals.username = req.user?.username || null;
  next();
});
app.use("/", authRoutes);
app.use("/", blogRoutes);
app.use('/api', uploadRoutes);

// ===== Connect MongoDB + Start Server =====
async function startServer() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/blogapp";
  const localFallbackUri = "mongodb://127.0.0.1:27017/blogapp";

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully...");
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed (${err.message}). Trying local MongoDB fallback...`);
    try {
      await mongoose.connect(localFallbackUri);
      console.log(`✅ Connected to local MongoDB at ${localFallbackUri}`);
    } catch (fallbackErr) {
      console.error("❌ Failed to connect to local MongoDB fallback:", fallbackErr.message);
      process.exit(1);
    }
  }

  const port = process.env.PORT || 3000;
  app.listen(port, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${port}...`)
  );
}

startServer();
