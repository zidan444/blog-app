const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const path = require("path");

// Routes & middleware
const { attachUserIfAny } = require("../middleware/auth");
const blogRoutes = require("../routes/blogRoutes");
const authRoutes = require("../routes/authRoutes");
const uploadRoutes = require("../routes/upload");

const app = express();

/* =====================
   Database Connection
===================== */

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
}

// Ensure DB is connected before handling request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

/* =====================
   Middleware
===================== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(process.cwd(), "public")));

/* =====================
   View Engine (EJS)
===================== */

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

/* =====================
   Global User Middleware
===================== */

app.use(attachUserIfAny);

app.use((req, res, next) => {
  res.locals.userId = req.user?.id || null;
  next();
});

/* =====================
   Routes
===================== */

app.use("/", authRoutes);
app.use("/", blogRoutes);
app.use("/api", uploadRoutes);

/* =====================
   Export for Vercel
===================== */

module.exports = app;
