const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");

// ===== File Upload Config (Multer) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ===== Middleware: check if logged in =====
function isLoggedIn(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// ===== Show All Blogs =====
router.get("/", async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.render("index", { blogs });
});

// ===== New Blog Form =====
router.get("/new", isLoggedIn, (req, res) => {
  res.render("new");
});

// ===== Create Blog =====
router.post("/", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { title, content, categories } = req.body;

    const blog = new Blog({
      title,
      content,
      categories: categories ? categories.split(",").map(c => c.trim()) : [],
      image: req.file ? "/uploads/" + req.file.filename : null,
      author: req.session.username
    });

    await blog.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error creating blog.");
  }
});

// ===== Show Blog by ID =====
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.send("Blog not found");
  res.render("show", { blog });
});

// ===== Edit Blog Form =====
router.get("/:id/edit", isLoggedIn, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.send("Blog not found");
  res.render("edit", { blog });
});

// ===== Update Blog =====
router.put("/:id", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { title, content, categories } = req.body;
    const updateData = {
      title,
      content,
      categories: categories ? categories.split(",").map(c => c.trim()) : []
    };

    if (req.file) updateData.image = "/uploads/" + req.file.filename;

    await Blog.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/" + req.params.id);
  } catch (err) {
    console.error(err);
    res.send("Error updating blog.");
  }
});

// ===== Delete Blog =====
router.delete("/:id", isLoggedIn, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error deleting blog.");
  }
});

module.exports = router;
