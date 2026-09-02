const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const mongoose = require("mongoose");
const { isLoggedIn, attachUserIfAny } = require("../middleware/auth");

// ===== Multer Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===== Show all blogs (with Search & Category filter) =====
router.get("/", attachUserIfAny, async (req, res) => {
  try {
    const { search, category } = req.query;
    let queryFilter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      queryFilter.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    if (category && category.trim()) {
      queryFilter.categories = category.trim();
    }

    const blogs = await Blog.find(queryFilter)
      .populate("author", "username")
      .sort({ createdAt: -1 });

    // Fetch all distinct categories for filter pills
    const allCategoriesRaw = await Blog.distinct("categories");
    const allCategories = allCategoriesRaw.filter(c => c && c.trim().length > 0);

    res.render("index", {
      blogs,
      userId: req.user?.id || null,
      search: search || "",
      activeCategory: category || "",
      allCategories
    });
  } catch (err) {
    console.error(err);
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
    const categoriesArray = req.body.categories
      ? req.body.categories.split(",").map(c => c.trim()).filter(Boolean)
      : [];

    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      categories: categoriesArray,
      image: req.file ? "/uploads/" + req.file.filename : (req.body.image || null),
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).send("Blog not found");
    }
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

    const categoriesArray = req.body.categories
      ? req.body.categories.split(",").map(c => c.trim()).filter(Boolean)
      : [];

    blog.title = req.body.title;
    blog.content = req.body.content;
    blog.categories = categoriesArray;
    if (req.file) blog.image = "/uploads/" + req.file.filename;
    else if (req.body.image) blog.image = req.body.image;

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
    const alreadyLiked = blog.likes && blog.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) blog.likes.pull(userId);
    else blog.likes.push(userId);

    await blog.save();
    res.redirect("/" + req.params.id);
  } catch {
    res.status(500).send("Error liking blog");
  }
});

// ===== Add Comment =====
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

// ===== Delete Comment =====
router.delete("/:id/comment/:commentId", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).send("Comment not found");

    // Allow deletion if user is comment author OR post author
    const isCommentAuthor = comment.user && comment.user.toString() === req.user.id;
    const isBlogAuthor = blog.author && blog.author.toString() === req.user.id;

    if (!isCommentAuthor && !isBlogAuthor) {
      return res.status(403).send("Not authorized to delete this comment");
    }

    blog.comments.pull(req.params.commentId);
    await blog.save();
    res.redirect("/" + req.params.id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting comment");
  }
});

module.exports = router;

