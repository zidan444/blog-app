require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// ===== Middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(methodOverride('_method'));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || "fallbacksecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Make session data available in all EJS templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentUser = req.session.userId || null;
  next();
});

// EJS setup
app.set('view engine', 'ejs');

// ===== Routes =====
const blogRoutes = require('./routes/blogRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/', authRoutes);
app.use('/', blogRoutes);

// ===== Connect MongoDB + Start Server =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected...');
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
