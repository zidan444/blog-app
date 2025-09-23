const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const { isLoggedIn, attachUserIfAny } = require("../middleware/auth");

// ===== Multer Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===== Show all blogs =====
router.get("/", attachUserIfAny, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.render("index", { blogs, userId: req.user?.id || null });
  } catch {
    res.status(500).send("Error fetching blogs");
  }
});

// ===== New blog form =====
router.get("/new", isLoggedIn, (req, res) => {
  res.render("new");
});

// ===== Create blog =====
router.post("/", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      categories: req.body.categories ? req.body.categories.split(",") : [],
      image: req.file ? "/uploads/" + req.file.filename : null,
      author: req.user.id,
    });
    await blog.save();
    res.redirect("/");
  } catch {
    res.status(500).send("Error creating blog");
  }
});

// ===== Single blog =====
router.get("/:id", attachUserIfAny, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "username")
      .populate("comments.user", "username");

    if (!blog) return res.status(404).send("Blog not found");

    const shareUrl = `${req.protocol}://${req.get("host")}/${blog._id}`;
    res.render("show", { blog, userId: req.user?.id || null, shareUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ===== Edit blog =====
router.get("/:id/edit", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).send("Not authorized");
    }
    res.render("edit", { blog });
  } catch {
    res.status(500).send("Error loading edit page");
  }
});

// ===== Update blog =====
router.put("/:id", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).send("Not authorized");
    }

    blog.title = req.body.title;
    blog.content = req.body.content;
    blog.categories = req.body.categories ? req.body.categories.split(",") : [];
    if (req.file) blog.image = "/uploads/" + req.file.filename;

    await blog.save();
    res.redirect("/" + req.params.id);
  } catch {
    res.status(500).send("Error updating blog");
  }
});

// ===== Delete blog =====
router.delete("/:id", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).send("Not authorized");
    }
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch {
    res.status(500).send("Error deleting blog");
  }
});

// ===== Like blog =====
router.post("/:id/like", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.user.id;
    const alreadyLiked = blog.likes.includes(userId);

    if (alreadyLiked) blog.likes.pull(userId);
    else blog.likes.push(userId);

    await blog.save();
    res.redirect("/" + req.params.id);
  } catch {
    res.status(500).send("Error liking blog");
  }
});

// ===== Comment =====
router.post("/:id/comment", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    blog.comments.push({
      text: req.body.text,
      user: req.user.id,
    });

    await blog.save();
    res.redirect("/" + req.params.id);
  } catch {
    res.status(500).send("Error adding comment");
  }
});

module.exports = router;
