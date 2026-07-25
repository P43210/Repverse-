require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/db');
const passport = require('./config/passport');
const { attachCurrentUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionSecret = process.env.SESSION_SECRET || 'repverse_dev_secret_change_me';

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 14 } // 14 days
};

if (process.env.MONGODB_URI) {
  try {
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });
  } catch (err) {
    console.warn('[repverse] Falling back to MemoryStore for sessions:', err.message);
  }
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success')
  };
  res.locals.path = req.path;
  next();
});
app.use(attachCurrentUser);

// --- Routes ---
app.use(require('./routes/auth'));
app.use(require('./routes/pages'));
app.use(require('./routes/explorer'));
app.use(require('./routes/converter'));

// --- 404 ---
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found — Repverse' });
});

app.listen(PORT, () => {
  console.log(`[repverse] Running at http://localhost:${PORT}`);
});
