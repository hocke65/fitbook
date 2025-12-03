const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// JWKS client for Entra ID token validation
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

// Get signing key for Entra ID token validation
const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
};

// ============================================
// POST /api/auth/register - Registrera ny användare
// ============================================
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Ange en giltig e-postadress'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Lösenordet måste vara minst 6 tecken'),
    body('firstName').trim().notEmpty().withMessage('Förnamn krävs'),
    body('lastName').trim().notEmpty().withMessage('Efternamn krävs'),
  ],
  async (req, res) => {
    try {
      // Validera input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;

      // Kontrollera om e-post redan finns
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'E-postadressen är redan registrerad.'
        });
      }

      // Hasha lösenord
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Skapa användare
      const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, 'user')
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, passwordHash, firstName, lastName]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'Registrering lyckades!',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Registreringsfel:', error);
      res.status(500).json({ error: 'Serverfel vid registrering.' });
    }
  }
);

// ============================================
// POST /api/auth/login - Logga in
// ============================================
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Ange en giltig e-postadress'),
    body('password').notEmpty().withMessage('Lösenord krävs'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Hämta användare
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Felaktig e-post eller lösenord.'
        });
      }

      const user = result.rows[0];

      // Verifiera lösenord
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Felaktig e-post eller lösenord.'
        });
      }

      const token = generateToken(user.id);

      res.json({
        message: 'Inloggning lyckades!',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Inloggningsfel:', error);
      res.status(500).json({ error: 'Serverfel vid inloggning.' });
    }
  }
);

// ============================================
// GET /api/auth/me - Hämta aktuell användare
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role,
    },
  });
});

// ============================================
// POST /api/auth/entra-login - Login with Microsoft Entra ID
// ============================================
router.post('/entra-login', async (req, res) => {
  try {
    const { accessToken, account } = req.body;

    if (!accessToken || !account) {
      return res.status(400).json({
        error: 'Access token och konto krävs.'
      });
    }

    // Verify the access token (optional but recommended for production)
    // For now we trust the token from the frontend and use the account info

    const email = account.username?.toLowerCase();
    const name = account.name || '';
    const entraId = account.localAccountId;

    if (!email) {
      return res.status(400).json({
        error: 'Ingen e-postadress hittades i Microsoft-kontot.'
      });
    }

    // Parse name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || 'Microsoft';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Check if user exists by email or entra_id
    let result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR entra_id = $2',
      [email, entraId]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user with Entra ID
      const insertResult = await db.query(
        `INSERT INTO users (email, first_name, last_name, role, entra_id, auth_provider)
         VALUES ($1, $2, $3, 'user', $4, 'entra')
         RETURNING id, email, first_name, last_name, role, entra_id`,
        [email, firstName, lastName, entraId]
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];

      // Update entra_id if not set
      if (!user.entra_id && entraId) {
        await db.query(
          'UPDATE users SET entra_id = $1, auth_provider = $2 WHERE id = $3',
          [entraId, 'entra', user.id]
        );
      }
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Inloggning med Microsoft lyckades!',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Entra ID login error:', error);
    res.status(500).json({ error: 'Serverfel vid Microsoft-inloggning.' });
  }
});

module.exports = router;
