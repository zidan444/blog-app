const Blog = require("../models/blog");

// Show all blogs
exports.getAllBlogs = async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.render("index", { blogs });
};

// Show new blog form
exports.getNewForm = (req, res) => {
  res.render("new");
};

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    await Blog.create(req.body);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error creating blog");
  }
};

// Show single blog
exports.getSingleBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.send("Blog not found");
    res.render("show", { blog });
  } catch (err) {
    console.error(err);
    res.send("Error fetching blog");
  }
};

// Show edit form
exports.getEditForm = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.send("Blog not found");
    res.render("edit", { blog });
  } catch (err) {
    console.error(err);
    res.send("Error loading edit form");
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/" + req.params.id);
  } catch (err) {
    console.error(err);
    res.send("Error updating blog");
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error deleting blog");
  }
};
