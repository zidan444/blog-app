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
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER || process.env.PORT;

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully...");
  } catch (err) {
    console.error(`❌ Primary MongoDB connection failed (${err.message}).`);

    // On Render / cloud production, local MongoDB fallback does not exist
    if (isProduction && mongoUri.includes("127.0.0.1")) {
      console.error("⚠️ MONGO_URI environment variable is missing on Render!");
      console.error("Please add MONGO_URI in Render Environment Variables.");
      process.exit(1);
    }

    if (mongoUri.startsWith("mongodb+srv://")) {
      console.error("⚠️ Please check your MongoDB Atlas username/password in MONGO_URI (bad auth error).");
    }

    // Try local fallback only in local dev
    if (!isProduction) {
      console.warn("⚠️ Trying local MongoDB fallback (mongodb://127.0.0.1:27017/blogapp)...");
      try {
        await mongoose.connect("mongodb://127.0.0.1:27017/blogapp");
        console.log("✅ Connected to local MongoDB at mongodb://127.0.0.1:27017/blogapp");
      } catch (fallbackErr) {
        console.error("❌ Failed to connect to local MongoDB fallback:", fallbackErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  const port = process.env.PORT || 3000;
  app.listen(port, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${port}...`)
  );
}

startServer();
