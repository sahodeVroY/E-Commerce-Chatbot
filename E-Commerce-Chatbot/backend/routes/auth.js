const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new Database(path.join(__dirname, '../users.db'));
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  address TEXT,
  isVerified INTEGER DEFAULT 0, /* 0 for false, 1 for true */
  verificationToken TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  orderDate TEXT NOT NULL,
  totalAmount REAL NOT NULL,
  items TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
)`);

const JWT_SECRET = 'supersecretkey';
const SALT_ROUNDS = 10;

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36); // Simple token generation

    const stmt = db.prepare('INSERT INTO users (email, password, isVerified, verificationToken) VALUES (?, ?, ?, ?)');
    stmt.run(email, hashedPassword, 0, verificationToken);

    // Simulate sending verification email
    console.log(`Verification email sent to ${email} with token: ${verificationToken}`);

    res.json({ success: true, message: 'Registration successful! Please verify your email.' });
  } catch (err) {
    console.log('Registration error:', err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email already registered.' });
    } else {
      res.status(500).json({ error: 'Registration failed.' });
    }
  }
});

// Send verification email
router.post('/send-verification-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const updateStmt = db.prepare('UPDATE users SET verificationToken = ? WHERE email = ?');
    updateStmt.run(verificationToken, email);

    console.log(`Verification email sent to ${email} with token: ${verificationToken}`);

    res.json({ success: true, message: 'Verification email sent.' });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

// Verify email
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE verificationToken = ?');
    const user = stmt.get(token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: 'Email already verified.' });
    }

    const updateStmt = db.prepare('UPDATE users SET isVerified = 1, verificationToken = NULL WHERE id = ?');
    updateStmt.run(user.id);

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Error verifying email:', err);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email);

  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified. Please check your inbox or request a new verification email.' });
    }

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    console.log('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Password reset (mock)
router.post('/reset', (req, res) => {
  const { email } = req.body;
  // Always respond success for demo
  res.json({ message: 'If this email is registered, a reset link has been sent.' });
});

// Social login (mock)
router.get('/google', (req, res) => {
  // In real app, redirect to Google OAuth
  const token = jwt.sign({ email: 'googleuser@example.com' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, provider: 'google' });
});
router.get('/github', (req, res) => {
  // In real app, redirect to GitHub OAuth
  const token = jwt.sign({ email: 'githubuser@example.com' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, provider: 'github' });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided!' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Access Denied: Invalid Token!' });
    }
    req.user = user; // Attach user payload to the request
    next();
  });
};

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT email, name, address FROM users WHERE email = ?');
    const user = stmt.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, address } = req.body;
  try {
    const stmt = db.prepare('UPDATE users SET name = ?, address = ? WHERE email = ?');
    stmt.run(name, address, req.user.email);
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old password and new password are required.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(req.user.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid old password.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
    updateStmt.run(hashedNewPassword, req.user.email);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Place a new order
router.post('/orders', authenticateToken, (req, res) => {
  const { totalAmount, items } = req.body;
  if (!totalAmount || !items) {
    return res.status(400).json({ error: 'Total amount and items are required.' });
  }
  try {
    const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const user = userStmt.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const orderDate = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO orders (userId, orderDate, totalAmount, items) VALUES (?, ?, ?, ?)');
    stmt.run(user.id, orderDate, totalAmount, JSON.stringify(items));
    res.json({ success: true, message: 'Order placed successfully.' });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// Get user orders
router.get('/orders', authenticateToken, (req, res) => {
  try {
    const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const user = userStmt.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const stmt = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY orderDate DESC');
    const orders = stmt.all(user.id);
    res.json(orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    })));
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Delete user account
router.delete('/profile', authenticateToken, (req, res) => {
  try {
    const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const user = userStmt.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Delete associated orders first to maintain referential integrity
    const deleteOrdersStmt = db.prepare('DELETE FROM orders WHERE userId = ?');
    deleteOrdersStmt.run(user.id);

    const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');
    deleteUserStmt.run(user.id);

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

module.exports = router; 