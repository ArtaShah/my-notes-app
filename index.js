require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// CRITICAL: CORS must explicitly allow your frontend IP/localhost and allow credentials (cookies)
app.use(cors({
  origin: ['http://localhost:3000', 'http://91.239.211.48:3000'], 
  credentials: true 
}));

app.use(express.json());

// Configure Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_fallback_key', // Add SESSION_SECRET to your .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Must be false since you are on HTTP, not HTTPS yet
    httpOnly: true, // Prevents JavaScript from reading the cookie (security)
    maxAge: 1000 * 60 * 60 * 24 // 1 day expiration
  }
}));

// Middleware to block unauthenticated users
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
};

// --- AUTHENTICATION ROUTES ---

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    // Log the user in immediately after registering
    req.session.userId = result.rows[0].id;
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error registering user. Username might exist.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id; // This creates the session cookie
      res.json({ id: user.id, username: user.username });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('connect.sid'); // connect.sid is the default session cookie name
    res.json({ message: 'Logged out successfully' });
  });
});

// Check if user is currently logged in (useful for frontend page loads)
app.get('/me', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});

// --- PROTECTED NOTES ROUTES ---

app.get('/notes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/notes', requireAuth, async (req, res) => {
  const { content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notes (content) VALUES ($1) RETURNING *',
      [content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});