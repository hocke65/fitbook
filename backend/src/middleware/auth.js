const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware för att verifiera JWT-token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Åtkomst nekad. Ingen token angiven.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hämta användare från databas för att säkerställa att den fortfarande finns
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Användaren finns inte längre.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token har gått ut. Logga in igen.' });
    }
    return res.status(403).json({ error: 'Ogiltig token.' });
  }
};

// Middleware för att kontrollera admin-behörighet
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Åtkomst nekad. Admin-behörighet krävs.'
    });
  }
  next();
};

// Generera JWT-token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
};
